import { IRESTResponse } from '../interfaces/IRESTClient';

abstract class RESTClient {

  public static get(url: string): Promise<IRESTResponse> {
    return this.xhrRequest('GET', url);
  }

  public static post(url: string, body: object): Promise<IRESTResponse> {
    return this.xhrRequest('POST', url, body);
  }

  /** Private Request Call */
  private static xhrRequest(type: string, url: string, body?: object): Promise<IRESTResponse> {
    return new Promise((resolve: any, reject: any): void => {
      const xmlhttp: XMLHttpRequest = new XMLHttpRequest();

      xmlhttp.onload = (): void => {

        const response: IRESTResponse = {
          etag: (type === 'GET' && xmlhttp.responseText !== '{}') ? xmlhttp.getResponseHeader('Etag') : null,
          jsonBody: xmlhttp.responseText,
          statusCode: xmlhttp.status,
        };

        resolve(response);
      };

      xmlhttp.onerror = (): void => {
        reject(new Error(xmlhttp.statusText));
      };

      xmlhttp.open(type, url, true);
      xmlhttp.setRequestHeader('Content-type', 'application/json');
      body ? xmlhttp.send(JSON.stringify(body)) : xmlhttp.send();
    });
  }
}

export default RESTClient;
