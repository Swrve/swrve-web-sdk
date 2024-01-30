import { SwrveSDK } from "../src/SwrveSDK";
import { ISwrveCampaign, ISwrveConfig, SwrveCoreSDK } from "@swrve/web-core";
import { SWRVE_DEVICE_ID } from "../src/helpers/ClientInfoConstants";
import ClientInfoHelper from "../src/helpers/ClientInfoHelper";
import { ISwrveSDKConfig } from "../src/interfaces/ISwrveSDKConfig";

jest.mock("@swrve/web-core");

describe("SwrveSDK", () => {
  beforeAll(() => {
    window.localStorage.setItem(SWRVE_DEVICE_ID, "device_id");
    jest
      .spyOn(ClientInfoHelper, "getBrowserInfo")
      .mockReturnValue({ name: "Chrome", version: "0" });
    jest
      .spyOn(ClientInfoHelper, "getOS")
      .mockReturnValue({ name: "Mac OSX", version: "0" });

    // mock checkCoreInstance to return mocked web-core
    jest.spyOn(SwrveSDK, "checkCoreInstance").mockReturnValue(SwrveCoreSDK);
  });

  describe("createInstance", () => {
    afterEach(() => {
      SwrveSDK.shutdown();
    });

    it("must be defined", () => {
      expect(SwrveSDK.createInstance).toBeDefined();
    });

    it("will create Core instance", () => {
      const coreInstance = jest.fn();
      SwrveCoreSDK.createInstance = coreInstance;

      SwrveSDK.createInstance({
        apiKey: "web_sdk-test_api_key",
        appId: 12345,
        externalUserId: "testUser",
      });

      expect(coreInstance.mock.calls.length).toBe(1);
    });

    it("must be a singleton", () => {
      const coreInstance = jest.fn();
      SwrveCoreSDK.createInstance = coreInstance;

      SwrveSDK.createInstance({
        apiKey: "web_sdk-test_api_key",
        appId: 12345,
        externalUserId: "testUser",
      });

      const instance1 = SwrveSDK.getInstance();

      SwrveSDK.createInstance({
        apiKey: "web_sdk-test_api_key",
        appId: 12345,
        externalUserId: "testUser",
      });

      const instance2 = SwrveSDK.getInstance();
      expect(instance1).toEqual(instance2);
    });

    it("must only initialize with a web_sdk apiKey", () => {
      const coreInstance = jest.fn();
      SwrveCoreSDK.createInstance = coreInstance;

      expect(() => {
        SwrveSDK.createInstance({
          apiKey: "test_api_key" /** non web-sdk api key */,
          appId: 12345,
          externalUserId: "testUser",
        });
      }).toThrowError();
    });

    it("must only initialize with correct configuration", () => {
      const coreInstance = jest.fn();
      SwrveCoreSDK.createInstance = coreInstance;

      expect(() => {
        SwrveSDK.createInstance({
          apiKey: "test_api_key" /** non web-sdk api key */,
          appId: 12345,
          externalUserId: undefined,
        });
      }).toThrowError();
    });
  });

  // --- Accessor Methods ---

  describe("getSDKVersion", () => {
    it("must be defined", () => {
      expect(SwrveSDK.getSDKVersion).toBeDefined();
    });

    it("must be the correct value", () => {
      expect(SwrveSDK.getSDKVersion()).toBe("Web 2.2.1");
    });
  });

  describe("getInstance", () => {
    it("must be defined", () => {
      expect(SwrveSDK.getInstance).toBeDefined();
    });

    it("must return the instance after being initialized", () => {
      const coreInstance = jest.fn();
      SwrveCoreSDK.createInstance = coreInstance;

      const originalInstance = SwrveSDK.createInstance({
        apiKey: "web_sdk-test_api_key",
        appId: 12345,
        externalUserId: "testUser",
      });

      expect(SwrveSDK.getInstance()).toEqual(originalInstance);
    });
  });

  describe("getConfig", () => {
    it("must be defined", () => {
      expect(SwrveSDK.getConfig).toBeDefined();
    });

    it("must pull from core and include web config", () => {
      const coreConfig = jest.fn().mockReturnValue({
        apiKey: "web_sdk-test_api_key",
        appId: 12345,
      } as Readonly<ISwrveConfig>);
      SwrveCoreSDK.getConfig = coreConfig;

      const expectedConfig = {
        apiKey: "web_sdk-test_api_key",
        appId: 12345,
        externalUserId: "testUser",
      } as ISwrveSDKConfig;

      expect(SwrveSDK.getConfig()).toEqual(expectedConfig);
    });
  });

  describe("getUserId", () => {
    it("must be defined", () => {
      expect(SwrveSDK.getUserId).toBeDefined();
    });

    it("must make the appropriate call to core", () => {
      const coreCall = jest.fn();
      SwrveCoreSDK.getUserId = coreCall;
      SwrveSDK.getUserId();
      expect(coreCall.mock.calls.length).toBe(1);
    });
  });

  describe("getExternalUserId", () => {
    it("must be defined", () => {
      expect(SwrveSDK.getExternalUserId).toBeDefined();
    });

    it("must make the appropriate call to core", () => {
      const coreCall = jest.fn();
      SwrveCoreSDK.getExternalUserId = coreCall;
      SwrveSDK.getExternalUserId();
      expect(coreCall.mock.calls.length).toBe(1);
    });
  });

  describe("getUserInfo", () => {
    it("must be defined", () => {
      expect(SwrveSDK.getUserInfo).toBeDefined();
    });

    it("must make the appropriate call to core", () => {
      const coreCall = jest.fn();
      SwrveCoreSDK.getUserInfo = coreCall;
      SwrveSDK.getUserInfo();
      expect(coreCall.mock.calls.length).toBe(1);
    });
  });

  describe("getResourceManager", () => {
    it("must be defined", () => {
      expect(SwrveSDK.getResourceManager).toBeDefined();
    });

    it("must make the appropriate call to core", () => {
      const coreCall = jest.fn();
      SwrveCoreSDK.getResourceManager = coreCall;
      SwrveSDK.getResourceManager();
      expect(coreCall.mock.calls.length).toBe(1);
    });
  });

  describe("getRealTimeUserProperties", () => {
    it("must be defined", () => {
      expect(SwrveSDK.getRealTimeUserProperties).toBeDefined();
    });

    it("must make the appropriate call to core", () => {
      const coreCall = jest.fn();
      SwrveCoreSDK.getRealTimeUserProperties = coreCall;
      SwrveSDK.getRealTimeUserProperties();
      expect(coreCall.mock.calls.length).toBe(1);
    });
  });

  // --- Event Management ---

  describe("event", () => {
    it("must be defined", () => {
      expect(SwrveSDK.event).toBeDefined();
    });

    it("must make the appropriate call to core", () => {
      const coreCall = jest.fn();
      SwrveCoreSDK.event = coreCall;
      SwrveSDK.event("test_event");
      expect(coreCall.mock.calls.length).toBe(1);
    });
  });

  describe("userUpdate", () => {
    it("must be defined", () => {
      expect(SwrveSDK.userUpdate).toBeDefined();
    });

    it("must make the appropriate call to core", () => {
      const coreCall = jest.fn();
      SwrveCoreSDK.userUpdate = coreCall;
      SwrveSDK.userUpdate({ test: "value" });
      expect(coreCall.mock.calls.length).toBe(1);
    });
  });

  describe("userUpdateWithDate", () => {
    it("must be defined", () => {
      expect(SwrveSDK.userUpdateWithDate).toBeDefined();
    });

    it("must make the appropriate call to core", () => {
      const coreCall = jest.fn();
      SwrveCoreSDK.userUpdateWithDate = coreCall;
      SwrveSDK.userUpdateWithDate("key", new Date());
      expect(coreCall.mock.calls.length).toBe(1);
    });
  });

  describe("purchase", () => {
    it("must be defined", () => {
      expect(SwrveSDK.purchase).toBeDefined();
    });

    it("must make the appropriate call to core", () => {
      const coreCall = jest.fn();
      SwrveCoreSDK.purchase = coreCall;
      SwrveSDK.purchase("test", "EUR", 30, 1);
      expect(coreCall.mock.calls.length).toBe(1);
    });
  });

  describe("iap", () => {
    it("must be defined", () => {
      expect(SwrveSDK.iap).toBeDefined();
    });

    it("must make the appropriate call to core", () => {
      const coreCall = jest.fn();
      SwrveCoreSDK.iap = coreCall;
      SwrveSDK.iap(2, "test_id", 30, "EUR");
      expect(coreCall.mock.calls.length).toBe(1);
    });
  });

  describe("currencyGiven", () => {
    it("must be defined", () => {
      expect(SwrveSDK.iap).toBeDefined();
    });

    it("must make the appropriate call to core", () => {
      const coreCall = jest.fn();
      SwrveCoreSDK.currencyGiven = coreCall;
      SwrveSDK.currencyGiven("test_currency", 10);
      expect(coreCall.mock.calls.length).toBe(1);
    });
  });

  // --- Lifecycle Management ---

  describe("shutdown", () => {
    it("must be defined", () => {
      expect(SwrveSDK.shutdown).toBeDefined();
    });

    it("must make the appropriate call to core", () => {
      const coreCall = jest.fn();
      SwrveCoreSDK.shutdown = coreCall;
      SwrveSDK.shutdown();
      expect(coreCall.mock.calls.length).toBe(1);
    });
  });

  describe("stopTracking", () => {
    it("must be defined", () => {
      expect(SwrveSDK.stopTracking).toBeDefined();
    });

    it("must make the appropriate call to core", () => {
      const coreCall = jest.fn();
      SwrveCoreSDK.stopTracking = coreCall;
      SwrveSDK.stopTracking();
      expect(coreCall.mock.calls.length).toBe(1);
    });
  });

  // --- Other ---

  describe("saveToStorage", () => {
    it("must be defined", () => {
      expect(SwrveSDK.saveToStorage).toBeDefined();
    });

    it("must make the appropriate call to core", () => {
      const coreCall = jest.fn();
      SwrveCoreSDK.saveToStorage = coreCall;
      SwrveSDK.saveToStorage();
      expect(coreCall.mock.calls.length).toBe(1);
    });
  });

  // --- Embedded Campaigns ---

  describe("embeddedMessageWasShownToUser", () => {
    it("must be defined", () => {
      expect(SwrveSDK.embeddedMessageWasShownToUser).toBeDefined();
    });

    it("must make the appropriate call to core", () => {
      const coreCall = jest.fn();
      SwrveCoreSDK.embeddedMessageWasShownToUser = coreCall;
      SwrveSDK.embeddedMessageWasShownToUser(null);
      expect(coreCall.mock.calls.length).toBe(1);
    });
  });

  describe("embeddedMessageButtonWasPressed", () => {
    it("must be defined", () => {
      expect(SwrveSDK.embeddedMessageButtonWasPressed).toBeDefined();
    });

    it("must make the appropriate call to core", () => {
      const coreCall = jest.fn();
      SwrveCoreSDK.embeddedMessageButtonWasPressed = coreCall;
      SwrveSDK.embeddedMessageButtonWasPressed(null, "button1");
      expect(coreCall.mock.calls.length).toBe(1);
    });
  });

  describe("getPersonalizedEmbeddedMessageData", () => {
    it("must be defined", () => {
      expect(SwrveSDK.getPersonalizedEmbeddedMessageData).toBeDefined();
    });

    it("must make the appropriate call to core", () => {
      const coreCall = jest.fn();
      SwrveCoreSDK.getPersonalizedEmbeddedMessageData = coreCall;
      SwrveSDK.getPersonalizedEmbeddedMessageData(null, {});
      expect(coreCall.mock.calls.length).toBe(1);
    });
  });

  describe("getPersonalizedText", () => {
    it("must be defined", () => {
      expect(SwrveSDK.getPersonalizedText).toBeDefined();
    });

    it("must make the appropriate call to core", () => {
      const coreCall = jest.fn();
      SwrveCoreSDK.getPersonalizedText = coreCall;
      SwrveSDK.getPersonalizedText("text", {});
      expect(coreCall.mock.calls.length).toBe(1);
    });
  });

  // --- Message Center ---

  describe("getMessageCenterCampaigns", () => {
    it("must be defined", () => {
      expect(SwrveSDK.getMessageCenterCampaigns).toBeDefined();
    });

    it("must make the appropriate call to core", () => {
      const coreCall = jest.fn();
      SwrveCoreSDK.getMessageCenterCampaigns = coreCall;
      SwrveSDK.getMessageCenterCampaigns();
      expect(coreCall.mock.calls.length).toBe(1);
    });
  });

  describe("showMessageCenterCampaign", () => {
    it("must be defined", () => {
      expect(SwrveSDK.showMessageCenterCampaign).toBeDefined();
    });

    it("must make the appropriate call to core", () => {
      const coreCall = jest.fn();
      SwrveCoreSDK.showMessageCenterCampaign = coreCall;
      SwrveSDK.showMessageCenterCampaign({} as ISwrveCampaign); //doesn't matter if it's empty
      expect(coreCall.mock.calls.length).toBe(1);
    });
  });

  describe("markMessageCenterCampaignAsSeen", () => {
    it("must be defined", () => {
      expect(SwrveSDK.markMessageCenterCampaignAsSeen).toBeDefined();
    });

    it("must make the appropriate call to core", () => {
      const coreCall = jest.fn();
      SwrveCoreSDK.markMessageCenterCampaignAsSeen = coreCall;
      SwrveSDK.markMessageCenterCampaignAsSeen({} as ISwrveCampaign); //doesn't matter if it's empty
      expect(coreCall.mock.calls.length).toBe(1);
    });
  });

  // --- Push Management ---

  describe("initializePushManager", () => {
    it("must be defined", () => {
      expect(SwrveSDK.initializePushManager).toBeDefined();
    });
  });

  describe("registerPush", () => {
    it("must be defined", () => {
      expect(SwrveSDK.registerPush).toBeDefined();
    });
  });

  describe("unregisterPush", () => {
    it("must be defined", () => {
      expect(SwrveSDK.unregisterPush).toBeDefined();
    });
  });
});
