/** IClientInfo */
import { IFlushConfig } from './ISwrveConfig';
export interface IBackgroundProcessor {
  timeoutProcess: number;
  isProcessing: boolean;
  lastProcessingStart: number;
  lastProcessingStop: number;

  init: (flushConfig: IFlushConfig) => void;
  processInBackground: () => void;
  shutdown: () => void;
  setAsStarted: () => void;
  setAsStopped: () => void;
}

export default IBackgroundProcessor;
