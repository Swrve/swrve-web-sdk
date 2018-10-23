import { swrveVersion } from '../config/AppConfigParams';
import { IEventBatchRequest, IEventBatchRequestBody, IEventBatchRequestBodyParams } from '../interfaces/IEventBatchRequest';
import { StorableEvent } from '../interfaces/IEvents';
import { IRESTResponse } from '../interfaces/IRESTClient';
import RESTClient from '../networking/RESTClient';

class EventAPIClient {
  public readonly apiVersion: number = 1;
  public readonly eventBatchUriPath: string = '/batch';

  private baseUrl: string;
  private userId: string;
  private deviceId: string;

  constructor(baseUrl: string, userId: string, deviceId: string) {
    this.baseUrl = new URL(this.apiVersion.toString(), baseUrl).toString();
    this.deviceId = deviceId;
    this.userId = userId;
  }

  public async sendEventBatch(params: IEventBatchRequestBodyParams, data: StorableEvent[], onSuccess?: (resp: IRESTResponse) => void, onFailure?: (err: IRESTResponse) => void): Promise<IRESTResponse> {
    const request: IEventBatchRequest = this.eventBatchRequestParams(params);
    request.body.data = data;

    return await RESTClient.post(request.url, request.body, onSuccess, onFailure);
  }

  public eventBatchRequestParams(params: IEventBatchRequestBodyParams): IEventBatchRequest {
    const url: string = `${this.baseUrl}${this.eventBatchUriPath}`;
    const body: IEventBatchRequestBody = this.requestBodyPrototype(params);

    return { url, body };
  }

  private requestBodyPrototype(params: IEventBatchRequestBodyParams): IEventBatchRequestBody {
    const reqBody: IEventBatchRequestBody = {} as IEventBatchRequestBody;
    reqBody.session_token = params.sessionToken;
    reqBody.app_version = params.appVersion;
    reqBody.user = this.userId;
    reqBody.unique_device_id = this.deviceId;
    reqBody.version = swrveVersion;

    return reqBody;
  }
}

export default EventAPIClient;
