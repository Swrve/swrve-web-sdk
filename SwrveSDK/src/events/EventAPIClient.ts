import { swrveVersion } from '../config/AppConfigParams';
import { IEventBatchRequestBody, IEventBatchRequestBodyParams } from '../interfaces/IEventBatchRequest';
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

  public async sendEventBatch(params: IEventBatchRequestBodyParams, data: any[]): Promise<any> {
    const request: any = this.eventBatchRequestParams(params);
    request.body.data = data;

    return await RESTClient.post(request.url, request.body);
  }

  public eventBatchRequestParams(params: IEventBatchRequestBodyParams): { url: string; body: object; } {
    const url: string = `${this.baseUrl}${this.eventBatchUriPath}`;
    const body: object = this.requestBodyPrototype(params);

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
