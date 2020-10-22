/** Resources & Campaigns interfaces -------------------- */

export interface IResourcesCampaignsQueryParams {
  api_key: string;
  app_store: string;
  app_version: string;
  device_name: string;
  device_height: string;
  device_type: string;
  device_width: string;
  etag?: string;
  joined: string;
  language: string;
  orientation: string;
  os: string;
  os_version: string;
  [key: string]: string;
  user: string;
  version: string;
}

export interface IInfoForSession {
  flushFrequency: number;
  flushRefreshDelay: number;
  qa: boolean;
  webPushPublicKey?: string;
}
