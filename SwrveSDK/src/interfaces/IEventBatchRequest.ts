import { ISwrveProfile } from './ISwrveProfile';

export interface IEventBatchRequestBodyParams {
  apiURL: string;
  sessionToken: string;
  userId: string;
  appVersion?: string;
}

export interface IEventBatchRequestBody {
  app_version: string;
  session_token: string;
  unique_device_id: string;
  user: string;
  version: number;
}
