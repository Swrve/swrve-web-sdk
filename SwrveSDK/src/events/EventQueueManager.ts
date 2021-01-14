import SwrveConfig from '../config/SwrveConfig';
import EventAPIClient from '../events/EventAPIClient';
import { IBackgroundProcessor } from '../interfaces/IBackgroundProcessor';
import { IRESTResponse } from '../interfaces/IRESTClient';
import { IFlushConfig } from '../interfaces/ISwrveConfig';
import LocalStorageClient from '../storage/LocalStorageClient';
import Swrve from '../Swrve';
import { nowInUtcTime } from '../util/Date';
import SwrveLogger from '../util/SwrveLogger';
import { StorableEvent } from '../interfaces/IEvents';

class EventQueueManager implements IBackgroundProcessor {

  public timeoutProcess: number;
  public isProcessing: boolean;
  public isSending: boolean;
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
    this.isSending = false;
    this.localStorageClient = new LocalStorageClient();
    this.eventAPIClient = new EventAPIClient(swrveConfig.ApiURL, this.userID, this.deviceID);
  }

  public async init() {
    await this.processInBackground();
  }

  public shutdown(): void {
    clearTimeout(this.timeoutProcess);
    try {
      this.sendEvents();
    } catch (err) {
      SwrveLogger.errorMsg('SwrveSDK - could not clear events before shutdown');
      SwrveLogger.errorMsg(err);
    }
    this.timeoutProcess = undefined;
  }

  public deleteEvents(eventKeys: string[]): void {
    SwrveLogger.infoMsg('Deleting Events from Queue');
    eventKeys.forEach((key) => {
      this.localStorageClient.deleteEventOnQueue(key);
    });
  }

  public async sendEvents() {
    const events = this.localStorageClient.fetchEventsFromQueue(this.userID);
    const eventKeys = this.localStorageClient.fetchEventKeys(this.userID);
    const onSuccess = (response: IRESTResponse) => {
      this.deleteEvents(eventKeys);
    };

    const onFailure = (response: IRESTResponse) => {
      if (response.statusCode < 500) {
        this.deleteEvents(eventKeys);
      } else {
        SwrveLogger.errorMsg(`Swrve API responded with status code: ${response.statusCode} and body: ${response.jsonBody}. Leaving events in queue`);
      }
    };

    const eventParams = {
      apiURL: this.swrveConfig.ApiURL,
      appVersion: this.swrveConfig.AppVersion,
      deviceID: this.deviceID,
      sessionToken: this.sessionToken,
      userId: this.userID,
    };

    if (this.isSending) {
      SwrveLogger.warnMsg('Swrve Event Queue is still sending...');
      return;
    }

    this.isSending = true;
    try {
      if (events.length > 0) {
        await this.eventAPIClient.sendEventBatch(eventParams, events, onSuccess, onFailure);
      }
    } catch (err) {
      SwrveLogger.warnMsg('There was an error sending the event batch');
      SwrveLogger.warnMsg(err);
    } finally {
      this.isSending = false;
    }
  }

  public async sendQAEvents(events: StorableEvent[]) {
    const eventsJson = JSON.stringify(events);
    SwrveLogger.infoMsg(`Sending QA event...${eventsJson}`);
    const onSuccess = (response: IRESTResponse) => {
      SwrveLogger.infoMsg(`QA event successfully sent: ${eventsJson}`);
    };

    const onFailure = (response: IRESTResponse) => {
      SwrveLogger.warnMsg(`QA event sending failed, status code: ${response.statusCode} and body:${response.jsonBody} event data:${eventsJson}`);
    };

    const eventParams = {
      apiURL: this.swrveConfig.ApiURL,
      appVersion: this.swrveConfig.AppVersion,
      deviceID: this.deviceID,
      sessionToken: this.sessionToken,
      userId: this.userID,
    };

    try {
      if (events.length > 0) {
        await this.eventAPIClient.sendEventBatch(eventParams, events, onSuccess, onFailure);
      }
    } catch (err) {
      SwrveLogger.warnMsg('There was an error sending the QA event');
      SwrveLogger.warnMsg(err);
    } finally {
      SwrveLogger.infoMsg("Finsihed QA event sending");
    }
  }

  public async processInBackground() {
    if (this.isProcessing) {
      // The previous process is still running
      SwrveLogger.warnMsg('EventQueueManager is already processing');
      return null;
    }
    this.setAsStarted();
    try {
      await this.sendEvents();
    } catch (err) {
      SwrveLogger.errorMsg('SwrveSDK - An error has occured processing events');
      SwrveLogger.errorMsg(err);
    }
    this.setAsStopped();

    // Do not use setInterval. This is not guaranteed to work
    this.timeoutProcess = window.setTimeout(this.processInBackground.bind(this), this.flushConfig.flushFrequency);
  }

  public setAsStarted(): void {
    this.isProcessing = true;
    this.lastProcessingStart = nowInUtcTime();
  }

  public setAsStopped(): void {
    this.isProcessing = false;
    this.lastProcessingStop = nowInUtcTime();
  }
}

export default EventQueueManager;
