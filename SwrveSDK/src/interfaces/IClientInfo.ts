/** IClientInfo */
export interface IClientInfo {
  user_id: string;
  browser: string | null;
  browser_version: string | null;
  device_height: string;
  device_width: string;
  install_date: string;
  language: string;
  os: string | null;
  os_version: string | null;
  timezone: string;
  user_agent: string | null;
  [key: string]: string | null;
}

export interface IClientInfoData {
  user_id: string;
  browser: string | null;
  browser_version: string | null;
  device_height: string;
  device_width: string;
  install_date: string;
  language: string;
  last_session?: string;
  os: string | null;
  os_version: string | null;
  timezone: string | null;
  user_agent: string | null;
  [key: string]: string | null;
}

/** Browser */
export interface IBrowser {
  name: string | null;
  version: string | null;
}

/** OS */
export interface IClientOS {
  name: string | null;
  version: string | null;
}

/** Screen */
export interface IScreen {
  height: string;
  width: string;
}

/** Interface for new device properties object */
export interface INewProps {
  screen: IScreen;
  language: string;
  timezone: string;
}

/** Used in ClientInfoHelper */

/** Browser */
export interface IBrowsersRegex {
  webkit: RegExp;
  appleWebkit: RegExp;
  chrome: RegExp;
  mozilla: RegExp;
  firefox: RegExp;
  msIE: RegExp;
  edge: RegExp;
  trident: RegExp;
  safari: RegExp;
  opera: RegExp;
}

export interface IBrowserInfo {
  chrome: boolean;
  firefox: boolean;
  msIE: boolean;
  safari: boolean;
  opera: boolean;
  [key: string]: boolean;
}

/** Time Zone */
export interface ITimeZoneFormats {
  GMTEDT: RegExp;
  GMT: RegExp;
  EDT: RegExp;
  T: RegExp;
  [key: string]: RegExp;
}
