import {
  IBrowser,
  IBrowserInfo,
  IClientOS,
  IScreen,
} from "../interfaces/IClientInfo";
import IDictionary from "../interfaces/IDictionary";
import SwrveLogger from "../util/SwrveLogger";
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
  SWRVE_LANGUAGE,
  SWRVE_NAV_LANGUAGE,
  SWRVE_OS,
  SWRVE_OS_VERSION,
  SWRVE_SDK_VERSION,
  SWRVE_TIMEZONE_NAME,
  SWRVE_UTC_OFFSET_SECONDS,
  SWRVE_DEVICE_TYPE,
  SWRVE_DEVICE_NAME,
} from "./ClientInfoConstants";

abstract class ClientInfoHelper {
  public static getClientInfo(): IDictionary<string> {
    const osInfo: IClientOS = this.getOS();
    const browserInfo: IBrowser = this.getBrowserInfo();

    return {
      [SWRVE_DEVICE_ID]: this.getDeviceId(),
      [SWRVE_DEVICE_NAME]: this.getDeviceName(),
      [SWRVE_OS]: "web",
      [SWRVE_OS_VERSION]: osInfo.version,
      [SWRVE_SDK_VERSION]: this.getSDKVersion(),
      [SWRVE_LANGUAGE]: this.getBrowserLanguage(),
      [SWRVE_COUNTRY_CODE]: this.getCountryCode(),
      [SWRVE_DEVICE_REGION]: this.getRegion(),
      [SWRVE_TIMEZONE_NAME]: this.getTimezoneName(),
      [SWRVE_APP_STORE]: appStore,
      [SWRVE_BROWSER_NAME]: browserInfo.name,
      [SWRVE_BROWSER_VERSION]: browserInfo.version,
      [SWRVE_DEVICE_TYPE]: this.getDeviceType(),
    };
  }
  /** OS */
  public static getOS(): IClientOS {
    const clientOS: IClientOS = {} as IClientOS;

    const versionInfo: RegExpMatchArray | null =
      navigator.userAgent.match(/\((.*?)\)/);
    if (versionInfo && versionInfo.length >= 2) {
      clientOS.version = versionInfo[1];
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
    return `${this.getOS().name} ${this.getBrowserInfo().name} ${
      this.getBrowserInfo().version
    }`;
  }

  /** Screen Resolution */
  public static getScreenResolution(): IScreen {
    return {
      height: window.screen.availHeight.toString() || "Unknown",
      width: window.screen.availWidth.toString() || "Unknown",
    };
  }

  public static getDocumentHeight() {
    const body = document.body;
    const html = document.documentElement;
    return Math.max(
      body.scrollHeight,
      body.offsetHeight,
      html.clientHeight,
      html.scrollHeight,
      html.offsetHeight
    );
  }

  public static getDocumentWidth() {
    const body = document.body;
    const html = document.documentElement;
    return Math.max(
      body.scrollWidth,
      body.offsetWidth,
      html.clientWidth,
      html.scrollWidth,
      html.offsetWidth
    );
  }

  public static getAvailableScreenHeight(): number {
    return typeof navigator !== "undefined" ? screen.availHeight : 0 || 0;
  }

  public static getAvailableScreenWidth(): number {
    // need to check each time because they might've resized their page
    return typeof navigator !== "undefined" ? screen.availWidth : 0 || 0;
  }

  /** Get the Language the Browser is set to */
  public static getBrowserLanguage(): string {
    /** Default language => English */
    const cannotFindLanguage: string = "Unknown";
    return (
      navigator[SWRVE_NAV_LANGUAGE] ||
      navigator.language.split("-")[0] ||
      cannotFindLanguage
    );
  }

  /** Timezone Name */
  public static getTimezoneName(): string {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return timezone || "Unknown";
  }

  /** UTC Offset(Seconds) */
  public static getUTCOffsetSeconds(date: Date): number {
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTimezoneOffset
    // Returns the difference between local time and UTC time in minutes and thus for our system we need to invert
    // So UTC+1 returns -60 and UTC-1 returns 60
    const utcOffsetSeconds = date.getTimezoneOffset() * -60;

    // Javascript use IEEE 754 standard for floating point arithmetic
    // which allows for signed zero values. To avoid this madness being
    // pass to our backend we need to remove the sign information
    return utcOffsetSeconds === -0 ? 0 : utcOffsetSeconds;
  }

  /** CountryCode */
  public static getCountryCode(): string {
    // TODO: navigator.language.split("-")[1] ||
    return "Unknown";
  }

  /** Region Info */
  public static getRegion(): string {
    return "Unknown";
  }

  /** Device ID */ //Return deviceID used for clientInfo
  public static getDeviceId(): string {
    // const currentInstance = Swrve.getCurrentInstance();
    // return currentInstance ? currentInstance.DeviceId.toString() : null;
    return null;
  }

  /** Device Type */
  public static getDeviceType(): string {
    const ua = navigator.userAgent.toLowerCase();
    if (
      /android|webos|iphone|ipad|ipod|ios|blackberry|iemobile|opera mini|mobi/i.test(
        ua
      )
    ) {
      return "mobile";
    }
    return "desktop";
  }

  /** Browser Information */
  public static getBrowserInfo(): IBrowser {
    const clientBrowser: IBrowser = { name: "Unknown", version: "N/A" };
    const userAgent: string = navigator.userAgent.toLowerCase();
    const browsersInfo: IBrowserInfo = this.checkBrowser();

    for (const key in browsersInfo) {
      if (browsersInfo[key]) {
        clientBrowser.name = key;
        clientBrowser.version = ClientInfoHelper.extractBrowserVersion(
          key,
          userAgent
        );
        return clientBrowser;
      }
    }

    SwrveLogger.error("Cannot identify browser");
    return clientBrowser;
  }

  public static getSDKVersion(): string {
    return sdkVersion;
  }

  private static extractBrowserVersion(key: string, userAgent: string): string {
    const safariVersionRegex = new RegExp("version/(([0-9])+(.([0-9])+)+)");
    const defaultVersionRegex = new RegExp("rv:(([0-9])+(.([0-9])+)+)");
    let match: RegExpMatchArray | null;

    /** Safari Special */
    if (key === "safari") {
      match = userAgent.match(safariVersionRegex);
      return match ? match[1] : "N/A";
    }

    /** Microsoft Special */
    match = userAgent.match(
      new RegExp(
        `(${key === "msIE" ? "msIE|edge" : key})( |\/)(([0-9])+(.([0-9])+)+)`
      )
    );
    if (match) {
      return match[3] || "N/A";
    }

    /** Fallback Default */
    match = userAgent.match(defaultVersionRegex);
    return match ? match[1] : "N/A";
  }

  private static checkBrowser(): IBrowserInfo {
    const uAgent: string = navigator.userAgent.toLowerCase();
    return {
      chrome:
        browsersRegex.webkit.test(uAgent) &&
        browsersRegex.chrome.test(uAgent) &&
        !browsersRegex.edge.test(uAgent) &&
        !browsersRegex.chromium.test(uAgent),
      firefox:
        browsersRegex.mozilla.test(uAgent) &&
        browsersRegex.firefox.test(uAgent) &&
        !browsersRegex.seamonkey.test(uAgent),
      msIE:
        browsersRegex.msIE.test(uAgent) ||
        browsersRegex.trident.test(uAgent) ||
        browsersRegex.edge.test(uAgent),
      opera:
        browsersRegex.mozilla.test(uAgent) &&
        browsersRegex.appleWebkit.test(uAgent) &&
        browsersRegex.chrome.test(uAgent) &&
        browsersRegex.safari.test(uAgent) &&
        browsersRegex.opera.test(uAgent),
      safari:
        browsersRegex.safari.test(uAgent) &&
        browsersRegex.appleWebkit.test(uAgent) &&
        !browsersRegex.chrome.test(uAgent),
    };
  }
}

export default ClientInfoHelper;
