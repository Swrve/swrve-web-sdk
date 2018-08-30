import { ISwrveConfig, ModeType } from '../interfaces/ISwrveConfig';

/**
 * The SwrveEnvironment Class holds the state in which the SDK is being ran.
 * It uses ModeType enum to determine if it's in a dev, unit testing or production state.
 *
 * Production is the default.
 *
 */

abstract class SwrveEnvironment {

  private static mode: ModeType = 'prod';

  public static get Mode(): ModeType {
    return this.mode;
  }

  public static set Mode(mode: ModeType) {
    this.mode = mode;
  }

  public static get DevMode(): boolean {
    return this.mode === 'dev';
  }

  public static get TestMode(): boolean {
    return this.mode === 'test';
  }

  public static get ProdMode(): boolean {
    return this.mode === 'prod';
  }
}

export default SwrveEnvironment;
