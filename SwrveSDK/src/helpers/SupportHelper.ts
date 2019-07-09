import { IBrowser, IClientOS } from '../interfaces/IClientInfo';
import { browserBlackList, osBlackList } from './ClientInfoConstants';
import ClientInfoHelper from './ClientInfoHelper';

abstract class SupportHelper {

  public static isTrackingSupported(): boolean {
    const osInfo: IClientOS = ClientInfoHelper.getOS();
    const browserInfo: IBrowser = ClientInfoHelper.getBrowserInfo();

    if (browserInfo.name == null || browserInfo.version == null) {
      /** exit out quickly if we don't have any information at all from the UA */
      return false;
    }

    return !((browserBlackList.includes(browserInfo.name)) || (osBlackList.includes(osInfo.name)));
  }
}

export default SupportHelper;
