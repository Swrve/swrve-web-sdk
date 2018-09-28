/**
 * Converts the URL-safe base64 encoded |base64UrlData| to an Uint8Array buffer.
 * We need this to convert the String object passed for the Push Registration Key into the right format for testing.
 */
export function base64UrlToUint8Array(base64UrlData) {
  const padding = '='.repeat((4 - base64UrlData.length % 4) % 4);
  const base64 = (base64UrlData + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const buffer = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    buffer[i] = rawData.charCodeAt(i);
  }
  return buffer;
}
