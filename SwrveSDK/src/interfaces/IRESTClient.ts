/** Networking - Rest client */
export interface IRESTResponse {
  etag?: string;
  statusCode: number;
  jsonBody?: string;
}
