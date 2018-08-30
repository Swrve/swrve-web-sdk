import SwrveConfig from '../config/SwrveConfig';
import EventAPIClient from '../events/EventAPIClient';
import { IBackgroundProcessor } from '../interfaces/IBackgroundProcessor';
import { IFlushConfig } from '../interfaces/ISwrveConfig';
import LocalStorageClient from '../storage/LocalStorageClient';

import Swrve from '../Swrve';

class EventQueueManager implements IBackgroundProcessor {

  public timeoutProcess: number;
  public isProcessing: boolean;
  public lastProcessingStart: number;
  public lastProcessingStop: number;

  private userID: string;
  private deviceID: string;
  private installDate: string;
  private sessionToken: string;
  private eventAPIClient: EventAPIClient;
  private localStorageClient: LocalStorageClient;
  private swrveConfig: SwrveConfig;
  private flushConfig: IFlushConfig;

  public constructor(swrveConfig: SwrveConfig, flushConfig: IFlushConfig, userID: string, sessionToken: string) {
    const currentInstance = Swrve.getCurrentInstance();
    const installDate = currentInstance ? currentInstance.InstallDate : undefined;
    const deviceId = currentInstance ? currentInstance.DeviceId : undefined;

    this.userID = userID;
    this.installDate = installDate,
    this.deviceID = deviceId,
    this.sessionToken = sessionToken;
    this.swrveConfig = swrveConfig;
    this.flushConfig = flushConfig;
    this.localStorageClient = new LocalStorageClient();
    this.eventAPIClient = new EventAPIClient(swrveConfig.ApiURL, this.userID, this.deviceID);
  }

  public init() {
    this.processInBackground();
  }

  public shutdown(): void {
    clearTimeout(this.timeoutProcess);
    try {
      this.sendEvents();
    } catch (err) {
      // tslint:disable-next-line:no-console
      console.error('SwrveSDK - could not clear events before shutdown', err);
    }
    this.timeoutProcess = undefined;
  }

  public sendEvents() {
    const eventParams = {
      apiURL: this.swrveConfig.ApiURL,
      appVersion: this.swrveConfig.AppVersion,
      deviceID: this.deviceID,
      sessionToken: this.sessionToken,
      userId: this.userID,
    };

    const events = this.localStorageClient.fetchEventsFromQueue(this.userID);
    if (events.length > 0) {
      this.eventAPIClient.sendEventBatch(eventParams, events);
    }
    
    this.localStorageClient.fetchEventKeys(this.userID).forEach((key) => {
      this.localStorageClient.deleteEventOnQueue(key);
    });
  }

  public processInBackground() {
    if (this.isProcessing === true) {
      // The previous process is still running
      return null;
    }
    this.setAsStarted();
    try {
      this.sendEvents();
    } catch (err) {
      // tslint:disable-next-line:no-console
      console.error('SwrveSDK - An error has occured processing events', err);
    }
    this.setAsStopped();

    // Do not use setInterval. This is not guaranteed to work
    this.timeoutProcess = setTimeout(this.processInBackground.bind(this), this.flushConfig.flushFrequency);
  }

  public setAsStarted(): void {
    this.isProcessing = true;
    this.lastProcessingStart = Date.now();
  }

  public setAsStopped(): void {
    this.isProcessing = false;
    this.lastProcessingStop = Date.now();
  }
}

export default EventQueueManager;
