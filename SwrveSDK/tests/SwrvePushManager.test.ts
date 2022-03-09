import { ISwrveSDKConfig } from "../src/interfaces/ISwrveSDKConfig";
import { SwrveCoreSDK } from "@swrve/web-core";
import SwrvePushManager, {
  serviceWorkerEventTypes,
} from "../src/push/SwrvePushManager";
import { SwrveSDK } from "../src/SwrveSDK";
import SwrveLogger from "../src/util/SwrveLogger";

// Mock SwrveSDK and SwrveWebCore
jest.mock("@swrve/web-core");
jest.mock("../src/SwrveSDK");

const swrveConfig: ISwrveSDKConfig = {
  apiKey: "web_sdk-testKey",
  appId: 1234,
  autoPushSubscribe: true,
  externalUserId: "extUserId",
};
const webApiKey = "test-web-api-key";

describe("SwrvePushManager", () => {
  let swrvePushManager: SwrvePushManager;

  beforeAll(() => {
    // mock checkCoreInstance to return mocked web-core
    jest.spyOn(SwrveSDK, "checkCoreInstance").mockReturnValue(SwrveCoreSDK);
  });

  beforeEach(() => {
    swrvePushManager = new SwrvePushManager(swrveConfig);
  });

  describe("api", () => {
    it("should have registerPush", () => {
      expect(swrvePushManager.registerPush).toBeDefined();
    });
    it("should have unregisterPush", () => {
      expect(swrvePushManager.unregisterPush).toBeDefined();
    });
  });

  describe("init", () => {
    describe("When it hasn't been initialized", () => {
      it("will initialize", () => {
        swrvePushManager = new SwrvePushManager(swrveConfig);
        jest.spyOn(swrvePushManager, "isPushSupported").mockReturnValue(true);
        expect(swrvePushManager.IsInitialized).toBe(false);
        swrvePushManager.init(webApiKey);
        expect(swrvePushManager.IsInitialized).toBe(true);
      });
    });

    describe("When it has already been initialized", () => {
      it("will not re-initialize", () => {
        swrvePushManager = new SwrvePushManager(swrveConfig);
        jest.spyOn(swrvePushManager, "isPushSupported").mockReturnValue(true);
        expect(swrvePushManager.IsInitialized).toBe(false);
        swrvePushManager.init(webApiKey);
        expect(swrvePushManager.IsInitialized).toBe(true);
        swrvePushManager.init(webApiKey);
        expect(swrvePushManager.IsInitialized).toBe(true);
        expect(swrvePushManager.isPushSupported).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("check()", () => {
    it("will throw an error if not initialized", () => {
      const pushManager = new SwrvePushManager(swrveConfig) as any;
      expect(() => {
        pushManager.check();
      }).toThrowError();
    });
  });

  describe("sendRegistrationProperties()", () => {
    let pushManager;
    let userUpdateMock;

    const stubbedSub = {
      endpoint: "http://my-push-service.com",
      keys: {
        auth: "1234",
        p256dh: "1234",
      },
      toJSON: () => {
        return {
          endpoint: "http://my-push-service.com",
          keys: {
            auth: "1234",
            p256dh: "1234",
          },
        };
      },
    };

    beforeEach(() => {
      pushManager = new SwrvePushManager(swrveConfig) as any;
      pushManager.init("1234-web-push-key");

      jest.spyOn(swrvePushManager, "isPushSupported").mockReturnValue(true);

      userUpdateMock = jest.fn();
      SwrveSDK.userUpdate = userUpdateMock;

      const loggerMock = jest.fn();
      SwrveLogger.info = loggerMock;
    });

    it("will trigger a user update", () => {
      const expectedToken = `${stubbedSub.endpoint}|${stubbedSub.keys.p256dh}|${stubbedSub.keys.auth}`;
      pushManager.sendPushRegistrationProperties(stubbedSub);

      expect(userUpdateMock.mock.calls.length).toBe(2);
      expect(SwrveSDK.userUpdate).toHaveBeenCalledWith({
        "swrve.web_push_token": expectedToken,
      });
    });

    it("will trigger sending browser permissions", () => {
      const sendBrowserPermissionsMock = jest.fn();
      pushManager.sendBrowserPermissions = sendBrowserPermissionsMock;
      pushManager.sendPushRegistrationProperties(stubbedSub);
      expect(pushManager.sendBrowserPermissions).toHaveBeenCalled();
    });

    describe("sendBrowserPermissions()", () => {
      describe("when there is push permission state", () => {
        it("will send a user update with permissions", (done) => {
          pushManager.sendBrowserPermissions();
          expect(SwrveSDK.userUpdate).toHaveBeenCalled();
          const permissionEvent = userUpdateMock.mock.calls[0][0];
          expect(
            permissionEvent["swrve.permission.web.push_notifications"]
          ).toBeDefined();
          done();
        });
      });
    });
  });

  describe("pushHandler()", () => {
    let pushManager;

    beforeEach(() => {
      pushManager = new SwrvePushManager(swrveConfig) as any;
      pushManager.init("1234-web-push-key");

      const onPushReceivedMock = jest.fn();
      const onPushClickedMock = jest.fn();
      const onPushClosedMock = jest.fn();

      pushManager.onPushReceived = onPushReceivedMock;
      pushManager.onPushClicked = onPushClickedMock;
      pushManager.onPushClosed = onPushClosedMock;
    });

    describe("When a push is received, clicked or closed", () => {
      it("will listen for and call callback functions", () => {
        const event = {
          data: {
            type: serviceWorkerEventTypes.swrvePushReceived,
          },
        };
        pushManager.pushHandler(event);
        expect(pushManager.onPushReceived).toHaveBeenCalled();

        event.data.type = serviceWorkerEventTypes.swrvePushNotificationClicked;
        pushManager.pushHandler(event);
        expect(pushManager.onPushClicked).toHaveBeenCalled();

        event.data.type = serviceWorkerEventTypes.swrvePushNotificationClosed;
        pushManager.pushHandler(event);
        expect(pushManager.onPushClosed).toHaveBeenCalled();
      });
    });
  });
});
