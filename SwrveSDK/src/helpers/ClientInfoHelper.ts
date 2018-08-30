import { IBrowser, IBrowserInfo, IClientOS, IScreen } from '../interfaces/IClientInfo';
import IDictionary from '../interfaces/IDictionary';
import Swrve from '../Swrve';
import SwrveLogger from '../util/SwrveLogger';
import {
  appStore,
  browsersRegex,
  osRegex,
  sdkVersion,
  SWRVE_APP_STORE,
  SWRVE_BROWSER_NAME,
  SWRVE_BROWSER_VERSION,
  SWRVE_COUNTRY_CODE,
  SWRVE_DEVICE_ID,
  SWRVE_DEVICE_REGION,
  SWRVE_INSTALL_DATE,
  SWRVE_LANGUAGE,
  SWRVE_NAV_LANGUAGE,
  SWRVE_OS,
  SWRVE_OS_VERSION,
  SWRVE_SDK_VERSION,
  SWRVE_TIMEZONE_NAME,
  SWRVE_UTC_OFFSET_SECONDS,
} from './ClientInfoConstants';

abstract class ClientInfoHelper {

  public static getClientInfo(): IDictionary<string | number> {

    const osInfo: IClientOS = this.getOS();
    const browserInfo: IBrowser = this.getBrowserInfo();
    const deviceProperties: IDictionary<string | number> = {
      [SWRVE_DEVICE_ID]: this.getDeviceId(),
      [SWRVE_OS]: osInfo.name,
      [SWRVE_OS_VERSION]: osInfo.version,
      [SWRVE_SDK_VERSION]: sdkVersion,
      [SWRVE_LANGUAGE]: this.getBrowserLanguage(),
      [SWRVE_COUNTRY_CODE]: this.getCountryCode(),
      [SWRVE_DEVICE_REGION]: this.getRegion(),
      [SWRVE_TIMEZONE_NAME]: this.getTimezoneName(),
      [SWRVE_UTC_OFFSET_SECONDS]: this.getUTCOffsetSeconds(new Date()),
      [SWRVE_APP_STORE]: appStore,
      [SWRVE_INSTALL_DATE]: this.getInstallDate(),
      [SWRVE_BROWSER_NAME]: browserInfo.name,
      [SWRVE_BROWSER_VERSION]: browserInfo.version,
    };

    return deviceProperties;
  }
  /** OS */
  public static getOS(): IClientOS {
    const clientOS: IClientOS = {} as IClientOS;

    const versionInfo: RegExpMatchArray | null = navigator.userAgent.match(/\((.*?)\)/);
    if (versionInfo && versionInfo.length >= 2) {
      clientOS.version = versionInfo[1] as string;
    }

    let os: { name: string; regex: RegExp };
    for (os of osRegex) {
      if (os.regex.test(navigator.userAgent)) {
        clientOS.name = os.name;
        break;
      }
    }

    return clientOS;
  }

  /** Device name */
  public static getDeviceName(): string {
    return `${this.getOS().name} ${this.getBrowserInfo().name} ${this.getBrowserInfo().version}`;
  }

  /** Screen Resolution */
  public static getScreenResolution(): IScreen {
    return {
      height: window.screen.availHeight.toString() || 'Unknown',
      width: window.screen.availWidth.toString() || 'Unknown',
    };
  }

  /** Get the Language the Browser is set to */
  public static getBrowserLanguage(): string {
    /** Default language => English */
    const cannotFindLanguage: string = 'Unknown';
    return navigator[SWRVE_NAV_LANGUAGE] || cannotFindLanguage;
  }

  /** Timezone Name */
  public static getTimezoneName(): string {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return timezone || 'Unknown';
  }

  /** UTC Offset(Seconds) */
  public static getUTCOffsetSeconds(date: Date): number {
    return date.getTimezoneOffset() * 6000;
  }

  /** CountryCode */
  public static getCountryCode(): string {
    return 'Unknown';
  }

  /** Region Info */
  public static getRegion(): string {
    return 'Unknown';
  }

  /** Install Date */
  public static getInstallDate(): string {
    const currentInstance = Swrve.getCurrentInstance();
    return currentInstance ? currentInstance.InstallDate.toString() : null;
  }

  /** Device ID */
  public static getDeviceId(): string {
    const currentInstance = Swrve.getCurrentInstance();
    return currentInstance ? currentInstance.DeviceId.toString() : null;
  }

  /** Browser Information */
  public static getBrowserInfo(): IBrowser {

    const clientBrowser: IBrowser = { name: 'Unknown', version: 'N/A' };
    const userAgent: string = navigator.userAgent.toLowerCase();
    const browsersInfo: IBrowserInfo = this.checkBrowser();

    let match: RegExpMatchArray | null;

    for (const key in browsersInfo) {
      if (browsersInfo[key]) {
        clientBrowser.name = key;

        /** Safari Special */
        if (key === 'safari') {
          match = userAgent.match(new RegExp('version\/(([0-9])+(\.([0-9])+)+)'));
          clientBrowser.version = match ? match[1] : 'N/A';
          return clientBrowser;
        }

        /** Microsoft Special */
        match = userAgent.match(new RegExp(`(${(key === 'msIE' ? 'msIE|edge' : key)})( |\/)(([0-9])+(.([0-9])+)+)`));

        if (match) {
          clientBrowser.version = match[3] || 'N/A';
        } else {
          match = userAgent.match(new RegExp('rv:(([0-9])+(.([0-9])+)+)'));
          clientBrowser.version = match ? match[1] : 'N/A';
        }
        return clientBrowser;
      }
    }

    SwrveLogger.errorMsg('Cannot identify browser');
    return clientBrowser;
  }

  private static checkBrowser(): IBrowserInfo {
    const userAgent: string = navigator.userAgent.toLowerCase();
    return {
      chrome: browsersRegex.webkit.test(userAgent) && browsersRegex.chrome.test(userAgent) && !browsersRegex.edge.test(userAgent),
      firefox: browsersRegex.mozilla.test(userAgent) && browsersRegex.firefox.test(userAgent),
      msIE: browsersRegex.msIE.test(userAgent) || browsersRegex.trident.test(userAgent) || browsersRegex.edge.test(userAgent),
      opera: browsersRegex.mozilla.test(userAgent) && browsersRegex.appleWebkit.test(userAgent) && browsersRegex.chrome.test(userAgent) &&
        browsersRegex.safari.test(userAgent) && browsersRegex.opera.test(userAgent),
      safari: browsersRegex.safari.test(userAgent) && browsersRegex.appleWebkit.test(userAgent) && !browsersRegex.chrome.test(userAgent),
    };
  }
}

export default ClientInfoHelper;
