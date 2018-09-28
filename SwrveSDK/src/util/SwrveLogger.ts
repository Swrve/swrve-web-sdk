/* tslint:disable:no-console */
import { messageConfig } from '../config/AppConfigParams';
import SwrveEnvironment from './SwrveEnvironment';

abstract class SwrveLogger {

  public static infoMsg(info: any): void {
    this.parseMsg(messageConfig.types.info, info);
  }

  public static warnMsg(warning: any): void {
    this.parseMsg(messageConfig.types.warn, warning);
  }

  public static errorMsg(error: any): void {
    this.parseMsg(messageConfig.types.error, error);
  }

  private static parseMsg(type: string, message: string | Error): boolean {
    const additionalMsg: any = (typeof message !== 'string') ? message : undefined;
    const mainMessage: string = `${messageConfig.title} ${type}: ${additionalMsg ? '' : message}`;

    switch (type) {
      case messageConfig.types.info:
        // tslint:disable-next-line:no-console
        return !SwrveEnvironment.ProdMode && this.outputMsg(console.info, mainMessage, additionalMsg) || true;
      case messageConfig.types.warn:
        // tslint:disable-next-line:no-console
        return !SwrveEnvironment.ProdMode && this.outputMsg(console.warn, mainMessage, additionalMsg) || true;
      case messageConfig.types.error:
        // tslint:disable-next-line:no-console
        return this.outputMsg(console.error, mainMessage, additionalMsg) || true;
    }
  }

  private static outputMsg(outputMethod: any, mainMsg: string, additionalMsg: any): void {
    if (additionalMsg) {
      console.group(mainMsg);
      if (Array.isArray(additionalMsg)) {
        additionalMsg.map((msg: any): void => { outputMethod(msg); });
      } else {
        outputMethod(additionalMsg);
      }
      console.groupEnd();
    } else {
      outputMethod(mainMsg);
    }
  }
}

export default SwrveLogger;
