import { swrveServiceWorkerName } from '../config/AppConfigParams';
import { ISwrveSDKConfig } from '../interfaces/ISwrveSDKConfig'

class SwrveConfig {
  
  private externalUserId: string;
  // Push properties
  private pushEnabled: boolean | null = false; // To request push permissions and subscriptions.
  private autoPushSubscribe: boolean | null = false;
  private userVisibleOnly?: boolean | null = true;
  private serviceWorker: string | null = null;

  public constructor(config: ISwrveSDKConfig) {
    this.externalUserId = config.externalUserId;
    this.pushEnabled = config.pushEnabled;
    this.autoPushSubscribe = config.autoPushSubscribe || false;
    this.serviceWorker = config.serviceWorker || swrveServiceWorkerName;
  }

  public get ExternalUserId(): string {
    return this.externalUserId;
  }

  public get ServiceWorker(): string {
    return this.serviceWorker;
  }

  public get AutoPushSubscribe(): boolean {
    return this.autoPushSubscribe;
  }

  public get UserVisibleOnly(): boolean {
    return this.userVisibleOnly;
  }
}

export default SwrveConfig;
