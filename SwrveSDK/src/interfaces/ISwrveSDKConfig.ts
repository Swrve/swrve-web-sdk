import { ISwrveWebPushConfig } from "@swrve/web-core";
import { ISwrveConfig } from "@swrve/web-core";

/** SwrveConfig Parameters */
export interface ISwrveSDKConfig extends ISwrveConfig {
  externalUserId: string;
  /** Push Parameters */
  pushEnabled?: boolean; // To request push permissions and subscriptions.
  serviceWorker?: string;
  autoPushSubscribe?: boolean;
  userVisibleOnly?: boolean; // Part of PushManager.subscribe's options.
  webPushConfig?: ISwrveWebPushConfig
}

export interface IFlushConfig {
  flushFrequency: number;
  flushRefreshDelay: number;
}
