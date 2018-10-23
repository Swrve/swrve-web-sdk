import { StorableEvent } from './IEvents';

export interface IEventBatchRequestBodyParams {
  apiURL: string;
  sessionToken: string;
  userId: string;
  appVersion?: string;
}

export interface IEventBatchRequest {
  body: IEventBatchRequestBody;
  url: string;
}

export interface IEventBatchRequestBody {
  app_version: string;
  data?: StorableEvent[];
  session_token: string;
  unique_device_id: string;
  user: string;
  version: number;
}
