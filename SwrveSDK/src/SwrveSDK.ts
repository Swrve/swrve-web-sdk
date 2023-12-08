import WebPlatformBridge from "./platform/WebPlatformBridge";
import {
  SwrveCoreSDK,
  ResourceManager,
  IUserInfo,
  ISwrveCampaign,
  IDictionary,
  IReadonlyDictionary,
  IReward,
  ISwrveWebPushConfig,
  ISwrveEmbeddedMessage,
  IUserResource,
} from "@swrve/web-core";
import SwrvePushManager from "./push/SwrvePushManager";
import SwrveLogger from "./util/SwrveLogger";
import { sdkVersion } from "./helpers/ClientInfoConstants";
import { ISwrveSDKConfig } from "./interfaces/ISwrveSDKConfig";
import { IValidateError } from "./interfaces/ISwrveValidator";
import SwrveValidator from "./helpers/SwrveValidator";

/** Callbacks */
export type OnSwrveLoadedCallback = () => void;
export type OnResourcesLoadedCallback = (
  resources: ReadonlyArray<IUserResource> | null
) => void;
export type GetResourcesCallback = (
  resources: ReadonlyArray<IUserResource>
) => void;
export type GetUserResourcesDiffCallback = (
  oldDictionary: IDictionary<IUserResource>,
  newDictionary: IDictionary<IUserResource>,
  json: any
) => any;

const webApiKeyCallback = (key: string, autoSubscribe: boolean) => {
  /** Initialize Push Manager */
  SwrveLogger.debug(`Initializing PushManager with WebPushAPIKey: ${key}`);
  SwrveSDK.initializePushManager(key);

  if (autoSubscribe) {
    /** Register for push if auto subscribe */
    SwrveLogger.debug("autoPushSubscribe: ON");
    SwrveSDK.registerPush();
  } else {
    SwrveLogger.debug(
      "SwrvePushManager Will not register for push. Auto subscribe is disabled"
    );
  }
};

let _swrveCoreSDK: SwrveCoreSDK | null = null;

export class SwrveSDK {
  private static _instance: SwrveSDK | null = null;
  private static _swrvePushManager: SwrvePushManager | null = null;
  private static _config: ISwrveSDKConfig | null = null;

  public static initWithConfig(
    config: ISwrveSDKConfig,
    onLoaded?: OnSwrveLoadedCallback
  ): SwrveSDK {
    SwrveSDK.createInstance(config);
    SwrveSDK._instance.init(onLoaded);

    return SwrveSDK._instance;
  }

  public static createInstance(config: ISwrveSDKConfig): SwrveSDK {
    if (SwrveSDK._instance) return SwrveSDK._instance;

    const errors: IValidateError | void =
      SwrveValidator.validateInitParams(config);
    if (errors) {
      SwrveValidator.outputErrors(errors);
      if (errors.devErrors.length == 1) {
        throw new Error(errors.devErrors[0]);
      } else {
        throw new Error("Multiple issues found with configuration");
      }
    }

    this._swrvePushManager = new SwrvePushManager(config);
    /**  Apply WebAPI Config callback  */
    config.webPushConfig = {
      webApiKeyCallback,
      autoPushSubscribe: config.autoPushSubscribe,
    } as ISwrveWebPushConfig;
    this._config = config;

    SwrveSDK._instance = new SwrveSDK(this._config);
    return SwrveSDK._instance;
  }

  private constructor(config: ISwrveSDKConfig) {
    _swrveCoreSDK = SwrveCoreSDK.createInstance(config, {
      platform: new WebPlatformBridge(),
    });
  }

  public init(onLoaded?: OnSwrveLoadedCallback): void {
    if (_swrveCoreSDK == null)
      throw Error("Please call SwrveSDK.createInstance() first.");

    _swrveCoreSDK.init(onLoaded);
  }

  public static checkCoreInstance(): typeof SwrveCoreSDK {
    if (_swrveCoreSDK == null)
      throw Error("Please call SwrveSDK.createInstance() first.");

    return SwrveCoreSDK;
  }

  //*************************************** Accessor methods ************************************//

  public static getInstance(): SwrveSDK {
    if (SwrveSDK._instance == null)
      throw Error("Please call SwrveSDK.createInstance() first.");

    return SwrveSDK._instance;
  }

  public static getUserInfo(): IUserInfo {
    return SwrveSDK.checkCoreInstance().getUserInfo();
  }

  public static getUserId(): string {
    return SwrveSDK.checkCoreInstance().getUserId();
  }

  public static getExternalUserId(): string | null {
    return SwrveSDK.checkCoreInstance().getExternalUserId();
  }

  public static getConfig(): Readonly<ISwrveSDKConfig> {
    const coreConfig =
      SwrveSDK.checkCoreInstance().getConfig() as ISwrveSDKConfig;
    coreConfig.externalUserId = this._config.externalUserId;
    return coreConfig;
  }

  public static getSDKVersion(): string {
    return sdkVersion;
  }

  public static getRealTimeUserProperties(): IDictionary<string> {
    return SwrveSDK.checkCoreInstance().getRealTimeUserProperties();
  }

  //*************************************** Event Management ************************************//

  public static event(
    name: string,
    payload: IDictionary<string | number> = {}
  ): void {
    SwrveSDK.checkCoreInstance().event(name, payload);
  }

  public static userUpdate(
    attributes: IReadonlyDictionary<string | number | boolean>
  ): void {
    SwrveSDK.checkCoreInstance().userUpdate(attributes);
  }

  public static userUpdateWithDate(keyName: string, date: Date): void {
    SwrveSDK.checkCoreInstance().userUpdateWithDate(keyName, date);
  }

  public static purchase(
    name: string,
    currency: string,
    cost: number,
    quantity: number
  ): void {
    SwrveSDK.checkCoreInstance().purchase(name, currency, cost, quantity);
  }

  public static iap(
    quantity: number,
    productId: string,
    productPrice: number,
    currency: string,
    rewards?: IReadonlyDictionary<IReward>
  ): void {
    SwrveSDK.checkCoreInstance().iap(
      quantity,
      productId,
      productPrice,
      currency,
      rewards
    );
  }

  public static currencyGiven(currencyGiven: string, amount: number): void {
    SwrveSDK.checkCoreInstance().currencyGiven(currencyGiven, amount);
  }

  public static sendQueuedEvents(): void {
    SwrveSDK.checkCoreInstance().sendQueuedEvents();
  }

  //*************************************** Lifecycle Management ************************************//

  public static shutdown(): void {
    // ensure the background thread is closed for push event sync loop
    if (this._swrvePushManager) {
      this._swrvePushManager.shutdown();
    }

    SwrveSDK.checkCoreInstance().shutdown();

    _swrveCoreSDK = null;
    SwrveSDK._instance = null;
  }

  public static stopTracking(): void {
    SwrveSDK.checkCoreInstance().stopTracking();
  }

  //*************************************** Other ************************************//

  public static saveToStorage(): void {
    SwrveSDK.checkCoreInstance().saveToStorage();
  }

  //*************************************** User Resources *****************************//

  public static getResourceManager(): ResourceManager {
    return SwrveSDK.checkCoreInstance().getResourceManager();
  }

  public static onResourcesLoaded(callback: OnResourcesLoadedCallback): void {
    SwrveSDK.checkCoreInstance().onResourcesLoaded(callback);
  }

  public static getResources(callback: GetResourcesCallback): void {
    SwrveSDK.checkCoreInstance().getUserResources(callback);
  }

  public static getUserResourcesDiff(
    callback: GetUserResourcesDiffCallback
  ): void {
    SwrveSDK.checkCoreInstance().getUserResourcesDiff(callback);
  }

  //*************************************** Embedded Campaigns *****************************//

  public static embeddedMessageWasShownToUser(message: ISwrveEmbeddedMessage) {
    SwrveSDK.checkCoreInstance().embeddedMessageWasShownToUser(message);
  }

  public static embeddedMessageButtonWasPressed(
    message: ISwrveEmbeddedMessage,
    buttonName: string
  ) {
    SwrveSDK.checkCoreInstance().embeddedMessageButtonWasPressed(
      message,
      buttonName
    );
  }

  public static getPersonalizedEmbeddedMessageData(
    message: ISwrveEmbeddedMessage,
    personalizationProperties: IDictionary<string>
  ): string | null {
    return SwrveSDK.checkCoreInstance().getPersonalizedEmbeddedMessageData(
      message,
      personalizationProperties
    );
  }

  public static getPersonalizedText(
    text: string,
    personalizationProperties: IDictionary<string>
  ): string | null {
    return SwrveSDK.checkCoreInstance().getPersonalizedText(
      text,
      personalizationProperties
    );
  }

  //*************************************** Message Center ******************************//

  public static getMessageCenterCampaigns(
    personalizationProperties?: IDictionary<string>
  ): ISwrveCampaign[] {
    return SwrveSDK.checkCoreInstance().getMessageCenterCampaigns(
      personalizationProperties
    );
  }

  public static showMessageCenterCampaign(
    campaign: ISwrveCampaign,
    personalizationProperties?: IDictionary<string>
  ): boolean {
    return SwrveSDK.checkCoreInstance().showMessageCenterCampaign(
      campaign,
      personalizationProperties
    );
  }

  public static markMessageCenterCampaignAsSeen(campaign: ISwrveCampaign) {
    SwrveSDK.checkCoreInstance().markMessageCenterCampaignAsSeen(campaign);
  }

  //**************************************** Push Management ****************************//

  public static initializePushManager(webPushApiKey: string): void {
    const userId = SwrveSDK.checkCoreInstance().getUserId();
    this._swrvePushManager.init(webPushApiKey, userId);
  }

  public static getPushManager(): SwrvePushManager {
    return this._swrvePushManager;
  }

  public static registerPush(
    onSuccess?: () => void,
    onFailure?: (error: Error) => void
  ): void {
    SwrveSDK.checkCoreInstance();
    this._swrvePushManager.registerPush(onSuccess, onFailure);
  }

  public static unregisterPush(
    onSuccess?: () => void,
    onFailure?: (err: Error) => void
  ): void {
    SwrveSDK.checkCoreInstance();
    this._swrvePushManager.unregisterPush(onSuccess, onFailure);
  }
}
