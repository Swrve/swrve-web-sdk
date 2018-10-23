import SwrveConfig from './config/SwrveConfig';
import SwrveValidator from './helpers/SwrveValidator';
import {
  ICurrencyParams,
  INamedEventParams,
  IPurchaseParams,
  IUserUpdateClientInfoAttributes,
  IUserUpdateWithDateParams,
  StorableEvent,
} from './interfaces/IEvents';
import { ISwrveConfig } from './interfaces/ISwrveConfig';
import { IValidateError } from './interfaces/ISwrveValidator';
import SwrvePushManager from './push/SwrvePushManager';
import Swrve from './Swrve';
import SwrveEnvironment from './util/SwrveEnvironment';

export type OnSwrveLoadedCallback = (error: string) => void;
let swrveInternal: Swrve | null = null;

class SwrveSDK {

  private static instance: SwrveSDK|null = null;

  public static createInstance(config: ISwrveConfig): SwrveSDK {

    if (!SwrveSDK.instance) {
      SwrveSDK.instance = new SwrveSDK(config);
      SwrveSDK.instance.init();
      return SwrveSDK.instance;
    }

    return SwrveSDK.instance;
  }

  private constructor(config: ISwrveConfig) {
    const errors: IValidateError | void = SwrveValidator.validateInitParams(config);
    if (errors) {
      SwrveValidator.outputErrors(errors);
      throw new TypeError('Parameters are not correct');
    }

    SwrveEnvironment.Mode = config.mode || 'prod';
    swrveInternal = Swrve.createInstance(config);
  }

  public init(): Promise <Swrve | void> {
    return SwrveSDK.checkInstance().init();
  }

  public static checkInstance(): Swrve {
    if (swrveInternal == null) {
      throw Error('Please call SwrveSDK.createInstance() first');
    }
    return swrveInternal;
  }

  /** public facing function calls */

  public static namedEvent(params: INamedEventParams): void {
    SwrveSDK.checkInstance().namedEvent(params);
  }

  public static userUpdate(attributes: IUserUpdateClientInfoAttributes): void {
    SwrveSDK.checkInstance().userUpdate(attributes);
  }

  public static userUpdateWithDate(params: IUserUpdateWithDateParams): void {
    SwrveSDK.checkInstance().userUpdateWithDate(params);
  }

  public static purchaseEvent (params: IPurchaseParams): void {
    SwrveSDK.checkInstance().purchaseEvent(params);
  }

  public static currencyGiven (params: ICurrencyParams): void {
    SwrveSDK.checkInstance().currencyGiven(params);
  }

  public static getQueuedEvents(): StorableEvent[] {
    return SwrveSDK.checkInstance().getQueuedEvents();
  }

  public static getConfig(): SwrveConfig {
    return SwrveSDK.checkInstance().Config;
  }

  public static getPushManager(): SwrvePushManager {
    return SwrveSDK.checkInstance().SwrvePushManager;
  }

  public static registerPush(onSuccess?: () => void, onFailure?: (err?: Error) => Error): void {
    return SwrveSDK.checkInstance().registerPush(onSuccess, onFailure);
  }

  public static unregisterPush(onSuccess?: () => void, onFailure?: (err?: Error) => void): void {
    return SwrveSDK.checkInstance().unregisterPush(onSuccess, onFailure);
  }

  public static getUserId(): string {
    return SwrveSDK.checkInstance().getUserID;
  }

  public static getExternalUserId(): string {
    return SwrveSDK.checkInstance().Config.ExternalUserId;
  }

  public static shutdown(): void {
    if (swrveInternal != null) {
      Swrve.shutdown();
    }

    swrveInternal = null;
    SwrveSDK.instance = null;
  }

  /** callbacks */

  public static set onSwrveLoaded(callback: OnSwrveLoadedCallback) {
    SwrveSDK.checkInstance().onSwrveLoaded = callback;
  }
}

export default SwrveSDK;
