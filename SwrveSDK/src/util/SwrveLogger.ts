import { messageConfig } from '../config/AppConfigParams';
import { ISwrveConfig, ModeType } from '../interfaces/ISwrveConfig';
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
        return !SwrveEnvironment.ProdMode && this.outputMsg(console.info, mainMessage, additionalMsg) || true;
      case messageConfig.types.warn:
        return !SwrveEnvironment.ProdMode && this.outputMsg(console.warn, mainMessage, additionalMsg) || true;
      case messageConfig.types.error:
        return this.outputMsg(console.error, mainMessage, additionalMsg) || true;
    }
  }

  /** Console tsLint rule ignored here since this is the only place it should happen */
  private static outputMsg(outputMethod: any, mainMsg: string, additionalMsg: any): void {
    if (additionalMsg) {
      // tslint:disable-next-line:no-console
      console.group(mainMsg);
      if (Array.isArray(additionalMsg)) {
        additionalMsg.map((msg: any): void => { outputMethod(msg); });
      } else {
        outputMethod(additionalMsg);
      }
      // tslint:disable-next-line:no-console
      console.groupEnd();
    } else {
      outputMethod(mainMsg);
    }
  }
}

export default SwrveLogger;
