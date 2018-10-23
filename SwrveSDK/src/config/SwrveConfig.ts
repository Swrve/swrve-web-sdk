import { swrveServiceWorkerName } from '../config/AppConfigParams';
import { ISwrveConfig, Stack } from '../interfaces/ISwrveConfig';

class SwrveConfig {

  private externalUserId: string;
  private appVersion: string;
  private appID: number | null = null;
  private apiKey: string | null = null;
  private apiURL: string | null = null;
  private contentURL: string | null = null;
  private identifyURL: string | null = null;
  private language: string | null = null;
  private newSessionInterval: number | null = null;
  private httpTimeoutSeconds: number | null = null;
  private serviceWorker: string | null = null;
  private stack: Stack;
  // Push properties
  private pushEnabled: boolean | null = false; // To request push permissions and subscriptions.
  private autoPushSubscribe: boolean | null = false;
  private userVisibleOnly?: boolean | null = true;

  public constructor(config: ISwrveConfig) {
    this.externalUserId = config.externalUserId;
    this.appID = config.appId;
    this.apiKey = config.apiKey;
    this.stack = config.stack || 'us';
    this.language = config.language || 'English';
    this.newSessionInterval = config.newSessionInterval || 30; /** seconds */
    this.resolveApiUrl(config);
    this.resolveContentUrl(config);
    this.resolveIdentifyUrl(config);
    this.appVersion = config.appVersion || '1.0';
    this.httpTimeoutSeconds = config.httpTimeoutSeconds || 10;
    this.autoPushSubscribe = config.autoPushSubscribe || false;
    this.serviceWorker = config.serviceWorker || swrveServiceWorkerName;
  }

  public get ExternalUserId(): string {
    return this.externalUserId;
  }

  public get AppVersion(): string {
    return this.appVersion;
  }

  public get AppID(): number {
    return this.appID;
  }

  public get ApiKey(): string {
    return this.apiKey;
  }

  public get ApiURL(): string {
    return this.apiURL;
  }

  public get ContentURL(): string {
    return this.contentURL;
  }

  public get IdentifyURL(): string {
    return this.identifyURL;
  }

  public get ServiceWorker(): string {
    return this.serviceWorker;
  }

  public get AutoPushSubscribe(): boolean {
    return this.autoPushSubscribe;
  }

  public get HttpTimeoutSeconds(): number {
    return this.httpTimeoutSeconds;
  }

  public get Language(): string {
    return this.language;
  }

  public get NewSessionInterval(): number {
    return this.newSessionInterval;
  }

  public get UserVisibleOnly(): boolean {
    return this.userVisibleOnly;
  }

  private resolveApiUrl(config: ISwrveConfig): void {
    const stackResult = config.stack ===  'eu' ? 'eu-api' : 'api';
    this.apiURL = config.apiURL || `https://${config.appId}.${stackResult}.swrve.com`;
  }

  private resolveContentUrl(config: ISwrveConfig): void {
    this.contentURL = config.contentURL || `https://${config.appId}.content.swrve.com`;
  }

  private resolveIdentifyUrl(config: ISwrveConfig): void {
    const stackResult = this.stack === 'eu' ? 'eu-identity' : 'identity';
    this.identifyURL = config.identifyURL || `https://${config.appId}.${stackResult}.swrve.com/identify`;
  }
}

export default SwrveConfig;
