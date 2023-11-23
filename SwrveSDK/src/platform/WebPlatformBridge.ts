import { IAsset, IDictionary } from "@swrve/web-core";
import { IKeyMapping } from "@swrve/web-core";
import {
  DevicePropertyName,
  IPlatform,
  IPlatformName,
  NetworkListener,
  NetworkMonitorHandle,
  NetworkStatus,
  NETWORK_CONNECTED,
  NETWORK_DISCONNECTED,
  generateUuid,
} from "@swrve/web-core";
import {
  SWRVE_BROWSER_NAME,
  SWRVE_BROWSER_VERSION,
  SWRVE_COUNTRY_CODE,
  SWRVE_DEVICE_ID,
  SWRVE_DEVICE_NAME,
  SWRVE_DEVICE_REGION,
  SWRVE_DEVICE_TYPE,
  SWRVE_LANGUAGE,
  SWRVE_OS,
  SWRVE_OS_VERSION,
  SWRVE_TIMEZONE_NAME,
} from "../helpers/ClientInfoConstants";
import ClientInfoHelper from "../helpers/ClientInfoHelper";

// First numeric part of Samsung and LG model names indicates screen size in inches
export function detectScreenDiagonal(modelName: string): number {
  let size: any;
  const match = modelName.match(/\d+/);
  if (match) {
    size = parseInt(match[0], 10);
  }

  // fallback to median screen size on the market
  return size || 27;
}

export function calculatePPI(
  pixelWidth: number,
  pixelHeight: number,
  inchDiagonal: number
): number {
  const pixelDiagonal = Math.sqrt(
    pixelWidth * pixelWidth + pixelHeight * pixelHeight
  );
  return Math.round(pixelDiagonal / inchDiagonal);
}

const defaultMapping: IKeyMapping = {
  36: "Return",
  38: "Up",
  40: "Down",
  37: "Left",
  39: "Right",
  13: "Enter",
  65: "A",
  66: "B",
  67: "C",
  68: "D",
  8: "Back",
  179: "Play",
  227: "FastForward",
  228: "Rewind",
  112: "F1",
};

export default class WebPlatformBridge implements IPlatform {
  /** True if the platform needs a proxy. */
  protected needsProxy: boolean = true;

  /** True if this platform supports the magic wand. */
  protected supportsMagicWandNatively: boolean = false;

  /** Number of history entries on start. */
  protected startHistoryLength: number = 0;

  protected _firmware: string;
  protected _deviceName: string;
  protected _deviceID: string;
  protected _model: string;
  protected _os: string;
  protected _osVersion: string;
  protected _language: string;
  protected _countryCode: string;
  protected _screenDPI: number;
  protected _screenHeight: number;
  protected _screenWidth: number;
  protected _timezone: string;
  protected _region: string;
  protected _deviceType: string;
  protected _browserVersion: string;
  protected _utcOffSetSeconds: number;
  protected networkMonitorHandle?: NetworkMonitorHandle;
  protected networkListeners: NetworkListener[] = [];

  public constructor() {
    const info = ClientInfoHelper.getClientInfo();

    this._region = info[SWRVE_DEVICE_REGION];
    this._language = info[SWRVE_LANGUAGE];
    this._countryCode = info[SWRVE_COUNTRY_CODE];
    this._deviceName = info[SWRVE_DEVICE_NAME];
    this._deviceID = this.findOrCreateDeviceId();
    this._deviceType = info[SWRVE_DEVICE_TYPE];
    this._timezone = info[SWRVE_TIMEZONE_NAME];
    this._osVersion = info[SWRVE_OS_VERSION] || "Unknown";
    this._browserVersion = info[SWRVE_BROWSER_VERSION];
    this._utcOffSetSeconds = ClientInfoHelper.getUTCOffsetSeconds(new Date());
    this._os = info[SWRVE_OS] || "Unknown";
    this._model = info[SWRVE_BROWSER_NAME];
    this._firmware = "";
    this._screenHeight = ClientInfoHelper.getAvailableScreenHeight();
    this._screenWidth = ClientInfoHelper.getAvailableScreenWidth();
    this._screenDPI =
      calculatePPI(
        this._screenWidth,
        this._screenHeight,
        detectScreenDiagonal("replace")
      ) || 1000;

    this._deviceName = ClientInfoHelper.getDeviceName();
  }

  public init(deviceProperties: readonly DevicePropertyName[]): Promise<void> {
    this.startHistoryLength = window.history.length;

    const cache = document.createElement("div");
    cache.id = "PALImageCache";
    cache.style.overflow = "hidden";
    cache.style.position = "absolute";
    cache.style.left = "-10000px";
    cache.style.width = "1px";
    cache.style.height = "1px";

    if (document.getElementById("PALImageCache") === null) {
      document.body.appendChild(cache);
    }

    return Promise.resolve();
  }

  public name(): IPlatformName {
    return {
      name: "Browser",
      variation: "Web",
    };
  }

  public get deviceName() {
    return ClientInfoHelper.getDeviceName();
  }

  public get synchronousStorage(): Storage {
    return window.localStorage;
  }

  public get appStore(): string {
    return "web";
  }

  public get firmware(): string {
    return this._firmware || "";
  }

  public get deviceID(): string {
    return this._deviceID;
  }

  public get model(): string {
    return this._model || "";
  }

  public get os(): string {
    return ClientInfoHelper.getOS().name || "unknown";
  }

  public get osVersion(): string {
    return ClientInfoHelper.getOS().version || "unknown";
  }

  public get deviceType(): string {
    return ClientInfoHelper.getDeviceType();
  }

  public get timezone(): string {
    return this._timezone;
  }

  public get region(): string {
    return this._region;
  }

  public get language(): string {
    return this._language;
  }

  public get countryCode(): string {
    return this._countryCode;
  }

  public get screenDPI(): number {
    return this._screenDPI;
  }

  public get screenHeight(): number {
    return this._screenHeight;
  }

  public get screenWidth(): number {
    return this._screenWidth;
  }

  public getNeedsProxy(): boolean {
    return this.needsProxy;
  }

  public getSupportsMagicWandNatively(): boolean {
    return this.supportsMagicWandNatively;
  }

  public disableScreenSaver(): void {
    console.error("platform does not know how to disable screensaver");
  }

  public enableScreenSaver(): void {
    console.error("platform does not know how to enable screensaver");
  }

  public exit(toMenu?: boolean): void {
    const backlength = window.history.length - this.startHistoryLength - 1;
    window.history.go(-backlength);
  }

  public getDeviceBrowserVersion(): string {
    return ClientInfoHelper.getBrowserInfo().version;
  }

  public getDeviceProperties(): IDictionary<string | number> {
    let clientInfo = ClientInfoHelper.getClientInfo();
    clientInfo[SWRVE_DEVICE_ID] = this._deviceID;
    return clientInfo;
  }

  public supportsHDR(): boolean {
    return false;
  }

  public getKeymapping(): IKeyMapping {
    return defaultMapping;
  }

  public downloadAssets(assets: readonly IAsset[]): Promise<void> {
    const downloading = assets.map((asset) => {
      const img = document.createElement("img");
      img.src = asset.path;

      console.log("PAL download " + asset.path);

      const imageCache = document.getElementById("PALImageCache");
      if (imageCache) {
        imageCache.appendChild(img);
      } else {
        console.log(" PAL: Image cache does not exist");
      }

      return new Promise<void>((resolve, reject) => {
        img.addEventListener("load", () => {
          resolve();
        });
        img.addEventListener("error", () => {
          reject();
        });
      });
    });

    return Promise.all(downloading).then(() => void 0);
  }

  public openLink(link: string): void {
    window.open(link);
  }

  public monitorNetwork(networkListener: NetworkListener): NetworkListener {
    if (this.networkMonitorHandle === undefined) {
      this.networkMonitorHandle = this.initNetworkListener();
    }
    this.networkListeners.push(networkListener);
    return networkListener;
  }

  public stopMonitoringNetwork(networkListener: NetworkListener): void {
    throw new Error("Method not implemented.");
  }

  protected triggerNetworkChange(status: NetworkStatus): void {
    this.networkListeners.forEach((listener) => listener(status));
  }

  protected initNetworkListener(): NetworkMonitorHandle {
    const onOnline = () => this.triggerNetworkChange(NETWORK_CONNECTED);
    const onOffline = () => this.triggerNetworkChange(NETWORK_DISCONNECTED);
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return [onOnline, onOffline];
  }

  protected removeNetworkListener(handle: NetworkMonitorHandle): void {
    const [onOnline, onOffline] = <[() => void, () => void]>handle;
    window.removeEventListener("offline", onOffline);
    window.removeEventListener("online", onOnline);
  }

  private findOrCreateDeviceId(): string {
    let currentDeviceId = this.synchronousStorage.getItem(SWRVE_DEVICE_ID);
    if (currentDeviceId) return currentDeviceId;

    currentDeviceId = generateUuid().toString();
    this.synchronousStorage.setItem(SWRVE_DEVICE_ID, currentDeviceId);
    return currentDeviceId;
  }
}
