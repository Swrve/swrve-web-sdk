import { messageConfig } from '../config/AppConfigParams';
import { ISwrveSDKConfig } from '../interfaces/ISwrveSDKConfig';
import { IValidateError } from '../interfaces/ISwrveValidator';
import SwrveLogger from '../util/SwrveLogger';

/** Main Error Title */
const urlExpr: RegExp = /[(https):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/ig;

/** Validator Service(abstract class) */
abstract class SwrveValidator {
  /** Validates a externalUserId */
  public static validateExternalUserId(userId: string | void): string[] {
    const errors: string[] = [];
    const type: string = 'string';
    if (userId != null && typeof userId !== type) { errors.push(`externalUserId should be a ${type}`); }

    return errors;
  }

  /** Validates an appId */
  public static validateAppId(appId: number | void): string[] {
    const errors: string[] = [];

    if (!appId) { errors.push('appId doesn\'t exist'); }

    const type: string = 'number';

    if (appId && isNaN(appId)) { errors.push(`appId should be a ${type}`); }

    return errors;
  }

  /** Validates an apiKey */
  public static validateApiKey(apiKey: string | void): string[] {
    const errors: string[] = [];
    const websdkKeyPrefix = 'web_sdk-';

    if (!apiKey) { errors.push('apiKey doesn\'t exist'); }

    const type: string = 'string';
    if (apiKey && typeof apiKey !== type) { errors.push(`apiKey should be a ${type}`); }
    if (apiKey && typeof apiKey === type && !apiKey.startsWith(websdkKeyPrefix)) { errors.push('apiKey should be a valid web_sdk api key'); }

    return errors;
  }

  /** Validates a contentURL */
  public static validateContentUrl(contentURL: string | void): string[] {
    const errors: string[] = [];

    const type: string = 'string';
    if (contentURL && typeof contentURL !== type) { errors.push(`contentURL should be a ${type}`); }

    const urlRegex: RegExp = new RegExp(urlExpr);

    if (contentURL && !urlRegex.test(contentURL)) { errors.push('contentURL isn\'t valid URL'); }

    return errors;
  }

  /** Validates a eventsUrl */
  public static validateEventsUrl(eventsUrl: string | void): string[] {
    const errors: string[] = [];

    const type: string = 'string';
    if (eventsUrl && typeof eventsUrl !== type) { errors.push(`eventsUrl should be a ${type}`); }

    const urlRegex: RegExp = new RegExp(urlExpr);

    if (eventsUrl && !urlRegex.test(eventsUrl)) { errors.push('eventsUrl isn\'t a valid URL'); }

    return errors;
  }

  /** Validates a apiURL */
  public static validateVersion(version: string | void): string[] {
    const errors: string[] = [];

    const type: string = 'string';
    if (version && typeof version !== type) { errors.push(`version should be a ${type}`); }

    const versionRegex: RegExp = /(([0-9])+(\.([0-9])+)+)/;
    if (version && !versionRegex.test(version)) { errors.push('version isn\'t valid'); }

    return errors;
  }

  /** Validates a session timeout */
  public static validateSessionTimeout(sessionTimeout: number | void): string[] {
    const errors: string[] = [];

    const type: string = 'number';
    if (sessionTimeout && typeof sessionTimeout !== type) { errors.push(`sessionTimeout should be a ${type}`); }

    if (sessionTimeout && sessionTimeout < 0) { errors.push('sessionTimeout should be positive integer or 0'); }

    return errors;
  }

  /** Validates initial parameters passed to the SwrveSession constructor */
  public static validateInitParams(params: ISwrveSDKConfig): IValidateError | void {
    const errorObj: IValidateError = {} as IValidateError;

    if (!params || Object.prototype.toString.call(params) !== '[object Object]') {
      errorObj.devErrors = [
        `Init params should follow the scheme:
        {
          externalUserId: string - *required
          appId: number - *required
          apiKey: string - *required
          eventsUrl: string
          contentUrl: string
          sessionTimeout: number
          version: string
        }`,
      ];
    } else {
      errorObj.devErrors = [
        ...this.validateExternalUserId(params.externalUserId),
        ...this.validateApiKey(params.apiKey),
        ...this.validateAppId(params.appId),
        ...this.validateContentUrl(params.contentUrl),
        ...this.validateEventsUrl(params.eventsUrl),
        ...this.validateVersion(params.appVersion),
        ...this.validateSessionTimeout(params.httpsTimeoutSeconds),
      ];

    }
    if (errorObj.devErrors.length) {
      errorObj.mainError = 'Initial configuration parameters are incorrect';
      return errorObj;
    }
  }

  public static outputErrors(errors: IValidateError): void {
      SwrveLogger.error(`${messageConfig.title} ${messageConfig.types.error}: ${errors.mainError}`);
      errors.devErrors.forEach((devError: string) => {
        SwrveLogger.error(` ${devError}`);
      });
  }

}

export default SwrveValidator;
