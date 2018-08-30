/** SDK Mode. Associated with logging and testing */
export declare type ModeType = 'dev' | 'test' | 'prod';
export type Stack = 'us'|'eu';

/** SwrveConfig Parameters */
export interface ISwrveConfig {
  appId: number;
  apiKey: string;
  apiURL?: string;
  contentURL?: string;
  externalUserId: string;
  identifyURL?: string;
  httpTimeoutSeconds?: number;
  appVersion?: string;
  mode?: ModeType;
  stack?: Stack;
  language?: string;
  newSessionInterval?: number;
  /** Push Parameters */
  serviceWorker?: string;
  autoPushSubscribe?: boolean;
}

export interface IFlushConfig {
  flushFrequency: number;
  flushRefreshDelay: number;
}
