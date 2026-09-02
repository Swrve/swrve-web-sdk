import {
  NETWORK_CONNECTED,
  NETWORK_DISCONNECTED,
} from "@swrve/web-core";
import { SWRVE_DEVICE_ID } from "../src/helpers/ClientInfoConstants";
import WebPlatformBridge from "../src/platform/WebPlatformBridge";

describe("WebPlatformBridge", () => {
  beforeEach(() => {
    window.localStorage.setItem(SWRVE_DEVICE_ID, "test-device-id");
  });

  afterEach(() => {
    jest.restoreAllMocks();
    window.localStorage.clear();
  });

  it("removes network listeners and browser handlers when monitoring stops", () => {
    const platform = new WebPlatformBridge();
    const firstListener = jest.fn();
    const secondListener = jest.fn();
    const addSpy = jest.spyOn(window, "addEventListener");
    const removeSpy = jest.spyOn(window, "removeEventListener");

    const firstHandle = platform.monitorNetwork(firstListener);
    const secondHandle = platform.monitorNetwork(secondListener);

    expect(addSpy).toHaveBeenCalledWith("offline", expect.any(Function));
    expect(addSpy).toHaveBeenCalledWith("online", expect.any(Function));

    window.dispatchEvent(new Event("online"));
    expect(firstListener).toHaveBeenCalledWith(NETWORK_CONNECTED);
    expect(secondListener).toHaveBeenCalledWith(NETWORK_CONNECTED);

    platform.stopMonitoringNetwork(firstHandle);

    window.dispatchEvent(new Event("offline"));
    expect(firstListener).toHaveBeenCalledTimes(1);
    expect(secondListener).toHaveBeenCalledWith(NETWORK_DISCONNECTED);
    expect(removeSpy).not.toHaveBeenCalled();

    platform.stopMonitoringNetwork(secondHandle);

    expect(removeSpy).toHaveBeenCalledWith("offline", expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith("online", expect.any(Function));

    window.dispatchEvent(new Event("online"));
    expect(firstListener).toHaveBeenCalledTimes(1);
    expect(secondListener).toHaveBeenCalledTimes(2);
  });

  describe("downloadAssets", () => {
    const setUpImageCache = (): HTMLElement => {
      const cache = document.createElement("div");
      cache.id = "PALImageCache";
      document.body.appendChild(cache);
      return cache;
    };

    /* window.fetch is set by direct property assignment below, which
       jest.restoreAllMocks() cannot undo - capture and restore it explicitly so
       the fake cannot leak into later tests (and so a test can legitimately
       remove fetch entirely). */
    const hadFetch = "fetch" in window;
    const originalFetch = (window as any).fetch;

    afterEach(() => {
      document.body.innerHTML = "";
      if (hadFetch) {
        (window as any).fetch = originalFetch;
      } else {
        delete (window as any).fetch;
      }
    });

    const videoAsset = (path: string) => ({
      getAssetID: () => path,
      getAssetPath: () => path,
      canRender: () => true,
      isVideo: true,
    });

    it("resolves instead of throwing when fetch is unavailable", async () => {
      /* Calling an undefined window.fetch throws synchronously, before any
         promise exists, so .catch() cannot see it: the throw would escape
         downloadAssets and take campaign storage down with it. Reachable in
         jsdom, which has no fetch. */
      setUpImageCache();
      delete (window as any).fetch;
      const platform = new WebPlatformBridge();
      const path = "https://third-party.example/video.mp4";

      await expect(
        platform.downloadAssets([{ id: "vid", path, isVideo: true }])
      ).resolves.toBeUndefined();

      /* nothing was cached, so the gate stays closed */
      expect(platform.checkStorageForAsset(videoAsset(path) as any)).toBe(false);
    });

    it("preloads a video asset with a no-cors fetch rather than an img element", async () => {
      /* video assets are arbitrary third-party URLs (dynamic_image_url). An
         <img> aborts after a few KB and caches nothing, and a cors fetch throws
         on a host that sends no CORS headers. */
      const cache = setUpImageCache();
      const fetchMock = jest.fn().mockResolvedValue({ type: "opaque" });
      (window as any).fetch = fetchMock;
      const platform = new WebPlatformBridge();

      await platform.downloadAssets([
        { id: "vid", path: "https://third-party.example/video.mp4", isVideo: true },
      ]);

      expect(fetchMock).toHaveBeenCalledWith(
        "https://third-party.example/video.mp4",
        { mode: "no-cors" }
      );
      expect(cache.querySelectorAll("img")).toHaveLength(0);
    });

    it("reports a video asset as stored once its preload resolves", async () => {
      setUpImageCache();
      (window as any).fetch = jest.fn().mockResolvedValue({ type: "opaque" });
      const platform = new WebPlatformBridge();
      const path = "https://third-party.example/video.mp4";

      expect(platform.checkStorageForAsset(videoAsset(path) as any)).toBe(false);

      await platform.downloadAssets([{ id: "vid", path, isVideo: true }]);

      expect(platform.checkStorageForAsset(videoAsset(path) as any)).toBe(true);
    });

    it("leaves a video asset unstored when its preload rejects", async () => {
      setUpImageCache();
      (window as any).fetch = jest
        .fn()
        .mockRejectedValue(new TypeError("Failed to fetch"));
      const platform = new WebPlatformBridge();
      const path = "https://third-party.example/video.mp4";

      const downloading = platform.downloadAssets([
        { id: "vid", path, isVideo: true },
      ]);

      /* a dead host must not stop the SDK acting on assets that did download */
      await expect(downloading).resolves.toBeUndefined();
      expect(platform.checkStorageForAsset(videoAsset(path) as any)).toBe(false);
    });

    it("does not leak a mocked fetch into later tests", () => {
      /* runs after the tests above that assign window.fetch - if the afterEach
         restore were missing, this would see their jest.fn(). */
      if (hadFetch) {
        expect((window as any).fetch).toBe(originalFetch);
      } else {
        expect("fetch" in window).toBe(false);
      }
    });

    it("resolves even when one asset fails to load", async () => {
      /* jsdom does not fetch subresources, so the load/error events that a
         real browser fires are dispatched by hand here. */
      const cache = setUpImageCache();
      const platform = new WebPlatformBridge();

      const downloading = platform.downloadAssets([
        { id: "good", path: "good.png" },
        { id: "broken", path: "broken.png" },
      ]);

      const elements = Array.from(cache.children);
      elements[0].dispatchEvent(new Event("load"));
      elements[1].dispatchEvent(new Event("error"));

      await expect(downloading).resolves.toBeUndefined();
    });
  });

  it("allows a network listener to stop monitoring while handling a network event", () => {
    const platform = new WebPlatformBridge();
    let handle: (status: number) => void;
    const listener = jest.fn(() => platform.stopMonitoringNetwork(handle));
    handle = platform.monitorNetwork(listener);

    expect(() => window.dispatchEvent(new Event("online"))).not.toThrow();
    expect(listener).toHaveBeenCalledWith(NETWORK_CONNECTED);

    window.dispatchEvent(new Event("offline"));
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
