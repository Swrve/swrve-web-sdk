import { IRESTResponse } from '../interfaces/IRESTClient';
import { isNil } from '../util/Nil';
import SwrveLogger from '../util/SwrveLogger';

enum HTTPTypes {GET = 'GET', POST = 'POST'}
declare type HTTPType = HTTPTypes.GET | HTTPTypes.POST;

abstract class RESTClient {

  public static get(url: string, onSuccess?: (resp: IRESTResponse) => void, onError?: (err: IRESTResponse) => void): Promise<IRESTResponse> {
    return this.xhrRequest(HTTPTypes.GET, url, null, onSuccess, onError);
  }

  public static post(url: string, body: object, onSuccess?: (resp: IRESTResponse) => void, onError?: (err: IRESTResponse) => void): Promise<IRESTResponse> {
    return this.xhrRequest(HTTPTypes.POST, url, body, onSuccess, onError);
  }

  /** Private Request Call */
  private static xhrRequest(type: HTTPType, url: string, body?: object, onSucceed?: (resp: IRESTResponse) => void, onError?: (err: IRESTResponse) => void): Promise<IRESTResponse> {
    return new Promise((resolve, reject): void => {
      const xmlhttp: XMLHttpRequest = this.getXmlHttpRequest(type, url);
      let response: IRESTResponse = null;

      xmlhttp.onload = () => {
        response = this.getXmlHTTPResponse(type, xmlhttp);
        if (response.statusCode >= 400) {
          SwrveLogger.warnMsg(`Restclient received status code: ${response.statusCode}`);
          if (!isNil(onError)) {
            onError(response);
          }
          return reject(response);
        }

        if (!isNil(onSucceed)) {
          onSucceed(response);
        }
        return resolve(response);
      };

      xmlhttp.onerror = (): void => {
        SwrveLogger.warnMsg('RESTClient encountered an error');
        if (!isNil(onError)) {
          onError(response);
        }
        return reject(new Error(xmlhttp.statusText));
      };

      body ? xmlhttp.send(JSON.stringify(body)) : xmlhttp.send();
    });
  }

  private static getXmlHTTPResponse(type: HTTPType, xmlhttp: XMLHttpRequest): IRESTResponse {
    const isGet = (type === HTTPTypes.GET && xmlhttp.responseText !== '{}');
    return {
      etag: isGet ? xmlhttp.getResponseHeader('Etag') : null,
      jsonBody: xmlhttp.responseText,
      statusCode: xmlhttp.status,
    };
  }

  private static getXmlHttpRequest(type: string, url: string): XMLHttpRequest {
    const xmlhttp: XMLHttpRequest = new XMLHttpRequest();
    xmlhttp.open(type, url, true);
    xmlhttp.setRequestHeader('Content-type', 'application/json');
    return xmlhttp;
  }
}

export default RESTClient;
