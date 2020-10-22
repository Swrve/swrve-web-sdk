import { version } from '../../package.json';
import { IBrowsersRegex } from '../interfaces/IClientInfo';

export const sdkVersion = `Web ${version}`;
export const appStore   = 'web';

/** Common Swrve Device Update Properties */
export const SWRVE_APP_STORE = 'swrve.app_store';
export const SWRVE_COUNTRY_CODE = 'swrve.country_code';
export const SWRVE_DEVICE_ID = 'swrve.device_id';
export const SWRVE_DEVICE_NAME = 'swrve.device_name';
export const SWRVE_DEVICE_REGION = 'swrve.device_region';
export const SWRVE_DEVICE_WIDTH = 'swrve.device_width';
export const SWRVE_DEVICE_HEIGHT = 'swrve.device_height';
export const SWRVE_DEVICE_DPI = 'swrve.device_dpi';
export const SWRVE_INSTALL_DATE = 'swrve.install_date';
export const SWRVE_LANGUAGE = 'swrve.language';
export const SWRVE_OS = 'swrve.os';
export const SWRVE_OS_VERSION = 'swrve.os_version';
export const SWRVE_SDK_VERSION = 'swrve.sdk_version';
export const SWRVE_TIMEZONE_NAME = 'swrve.timezone_name';
export const SWRVE_USER_ID = 'swrve.user_id';
export const SWRVE_UTC_OFFSET_SECONDS = 'swrve.utc_offset_seconds';

/** Unique to web-sdk Device Update Properties */
export const SWRVE_BROWSER_NAME = 'swrve.browser_name';
export const SWRVE_BROWSER_VERSION = 'swrve.browser_version';

/** Navigation Lookup */
export const SWRVE_NAV_LANGUAGE = 'language';

/** Browser */
export const browserList: string[] = ['chrome', 'opera', 'safari', 'firefox', 'msIE', 'Unknown'];

export const browsersRegex: IBrowsersRegex = {
  appleWebkit: /applewebkit/,
  chrome: /chrome/,
  chromium: /chromium/,
  edge: /edge/,
  firefox: /firefox/,
  mozilla: /mozilla/,
  msIE: /msie/,
  opera: /opr/,
  safari: /safari/,
  seamonkey: /seamonkey/,
  trident: /trident/,
  webkit: /webkit/,
};

// tslint:disable-next-line:prefer-array-literal
export const osRegex: Array<{ name: string; regex: RegExp }> = [
  { name: 'Windows 10', regex: /(Windows 10.0|Windows NT 10.0)/ },
  { name: 'Windows 8.1', regex: /(Windows 8.1|Windows NT 6.3)/ },
  { name: 'Windows 8', regex: /(Windows 8|Windows NT 6.2)/ },
  { name: 'Windows 7', regex: /(Windows 7|Windows NT 6.1)/ },
  { name: 'Windows Vista', regex: /Windows NT 6.0/ },
  { name: 'Windows Server 2003', regex: /Windows NT 5.2/ },
  { name: 'Windows XP', regex: /(Windows NT 5.1|Windows XP)/ },
  { name: 'Windows 2000', regex: /(Windows NT 5.0|Windows 2000)/ },
  { name: 'Windows ME', regex: /(Win 9x 4.90|Windows ME)/ },
  { name: 'Windows 98', regex: /(Windows 98|Win98)/ },
  { name: 'Windows 95', regex: /(Windows 95|Win95|Windows_95)/ },
  { name: 'Windows NT 4.0', regex: /(Windows NT 4.0|WinNT4.0|WinNT|Windows NT)/ },
  { name: 'Windows CE', regex: /Windows CE/ },
  { name: 'Windows 3.11', regex: /Win16/ },
  { name: 'Android', regex: /Android/ },
  { name: 'Open BSD', regex: /OpenBSD/ },
  { name: 'Sun OS', regex: /SunOS/ },
  { name: 'Linux', regex: /(Linux|X11)/ },
  { name: 'iOS', regex: /(iPhone|iPad|iPod)/ },
  { name: 'Mac OS X', regex: /Mac OS X/ },
  { name: 'Mac OS', regex: /(MacPPC|MacIntel|Mac_PowerPC|Macintosh)/ },
  { name: 'QNX', regex: /QNX/ },
  { name: 'UNIX', regex: /UNIX/ },
  { name: 'BeOS', regex: /BeOS/ },
  { name: 'OS/2', regex: /OS\/2/ },
  { name: 'Search Bot', regex: /(nuhk|Googlebot|Yammybot|python|ruby|curl|bingbot|Openbot|Slurp|MSNBot|Ask Jeeves\/Teoma|ia_archiver)/ },
];

/** lists of items we do not officially support */
export const browserBlackList: string[] = ['msIE'];
export const osBlackList: string[] = ['Search Bot'];
