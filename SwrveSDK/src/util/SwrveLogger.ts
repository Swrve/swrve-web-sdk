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
    let logLevel = null;

    switch (type) {
      case messageConfig.types.info:
        logLevel = console.info;
        if (!SwrveEnvironment.ProdMode) {
          this.outputMsg(logLevel, mainMessage, additionalMsg);
        } else {
          return false;
        }
        return true;
      case messageConfig.types.warn:
        logLevel = console.warn;
        if (!SwrveEnvironment.ProdMode) {
          this.outputMsg(logLevel, mainMessage, additionalMsg);
        } else {
          return false;
        }
        return true;
      case messageConfig.types.error:
        logLevel = console.error;
        this.outputMsg(logLevel, mainMessage, additionalMsg);
        return true;
    }
  }

  private static outputMsg(outputMethod: any, mainMsg: string, additionalMsg: any): void {
    if (additionalMsg) {
      console.group(mainMsg);
      if (Array.isArray(additionalMsg)) {
        additionalMsg.forEach((msg: any): void => { outputMethod(msg); });
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
