
import { Md5 } from 'ts-md5';
import SwrveConfig from './config/SwrveConfig';
import EventFactory from './events/EventFactory';
import EventValidator from './events/EventValidator';
import DateHelper from './helpers/DateHelper';
import {
  EventType,
  eventTypes,
  firstSessionEventName,
  INamedEventParams,
  IPurchaseParams,
  IUserUpdateWithDateParams,
} from './interfaces/IEvents';
import { IInfoForSession } from './interfaces/IResourcesCampaigns';
import { IFlushConfig, ISwrveConfig } from './interfaces/ISwrveConfig';
import ResourceCampaignsManager from './ResourceCampaignsManager';
import { isNil } from './util/Nil';
import SwrveLogger from './util/SwrveLogger';

import { defaultFlushFrequency, defaultFlushRefreshDelay, swrveDefaultDBName } from './config/AppConfigParams';
import EventQueueManager from './events/EventQueueManager';

import ClientInfoHelper from './helpers/ClientInfoHelper';
import SwrveProfile from './profile/SwrveProfile';

import LocalStorageClient from './storage/LocalStorageClient';
import { OnSwrveLoadedCallback } from './SwrveSDK';
import { generateUuid } from './util/Uuid';

class Swrve {
  private static instance: Swrve;
  private eventFactory: EventFactory;
  private onSwrveLoadedCallback: OnSwrveLoadedCallback | null = null;
  private sessionToken: string;
  private sessionStartedAt: number;
  private config: SwrveConfig;
  private flushConfig: IFlushConfig = {
    flushFrequency: defaultFlushFrequency,
    flushRefreshDelay: defaultFlushRefreshDelay,
  };
  private profile: SwrveProfile;
  private localStorageClient: LocalStorageClient;

  private eventQueueManager: EventQueueManager;
  private campaignManager: ResourceCampaignsManager;
  private webPushAPIKey: string;

  private constructor(config: ISwrveConfig) {
    this.eventFactory = new EventFactory();
    this.config = new SwrveConfig(config);
    this.localStorageClient = new LocalStorageClient();
  }

  /** Public properties */

  public get Config(): SwrveConfig {
    return this.config;
  }

  public get DeviceId(): string {
    return this.getPersistentDeviceId();
  }

  public get getUserID(): string {
    SwrveLogger.infoMsg('UserID Returned: ' + this.profile.UserId);
    return this.profile.UserId as string;
  }

  public get InstallDate(): string {
    return this.getPersistentInstallDate();
  }

  public get InitDate(): string {
    return this.profile.FirstSession.toString();
  }

  public get WebPushAPIKey(): string {
    return this.webPushAPIKey;
  }

  public get IsSessionStarted(): boolean {
    return (this.sessionStartedAt != null);
  }

  public get LastSession(): string {
    return this.profile.LastSession.toString();
  }

  public get Profile(): SwrveProfile {
    return this.profile;
  }

  public get SessionStartedAt(): number {
    return this.sessionStartedAt;
  }

  public static createInstance(config: ISwrveConfig): Swrve {
    /** creates a singleton of the internal swrve instance */
    Swrve.instance = Swrve.instance || new Swrve(config);
    return Swrve.instance;
  }

  public static getCurrentInstance(): Swrve {
    /** return the Swrve instance that's currently running  */
    return Swrve.instance;
  }

  /** Public static methods */
  public async init(): Promise<Swrve | void> {
    SwrveLogger.infoMsg('Starting New SwrveSDK instance');

    if (!this.hasPersistentInstallDate()) {
      this.sessionStartedAt = Date.now(); /** session startedAt in ms */
      this.setPersistentInstallDate();
    }

    if (!this.hasPersistentDeviceId()) {
      this.setPersistentDeviceId();
    }

    /** Start up the profile */
    try {
      this.profile = new SwrveProfile(this.config.ExternalUserId);

      if (!this.profile.IsIdentityResolved) {
        await this.profile.callIdentifyOnExternalUserId(this.config.ExternalUserId, this);

        if (this.profile.IsIdentityResolved) {
          SwrveLogger.infoMsg('Identify Resolved: ' + this.profile.UserId + ' for extUserId: ' + this.profile.ExternalUserId);
        }
      }

      if (this.profile.IsIdentityResolved) {
        SwrveLogger.infoMsg('Profile Resolved: ' + this.profile.UserId + ' for extUserId: ' + this.profile.ExternalUserId);

        /** check if we need to start a new session or restore an old one */
        if (!this.hasSessionRestored()) {
          // Send a session start event
          this.sessionStartedAt = Date.now(); /** session startedAt in ms */
          this.sessionStart();
        }

        this.sessionToken = this.generateSessionToken();

        /** call the getCampaignsAndResources request to get flush_frequency */
        await this.initCampaignsAndResources();

        /** start an async function to flush events */
        this.eventQueueManager = new EventQueueManager(this.config, this.flushConfig, this.getUserID, this.sessionToken);
        this.eventQueueManager.init();

        /** determines from the profile resolved if there has been a session before */
        if (this.profile.LastSession == null) {
          this.eventInternal(eventTypes.namedEvent, { name: firstSessionEventName });
        }

        /** Send User Properties */
        this.sendClientInfo();
        window.onbeforeunload = (): void => { Swrve.pageCloseHandler(); };
        if (this.config.AutoPushSubscribe) {
          SwrveLogger.infoMsg('autoPushSubscribe: ON');
        }

        /** inform the customer that Swrve has loaded */
        if (this.onSwrveLoadedCallback != null) {
          this.onSwrveLoadedCallback(null);
        }
      } else {
        Swrve.shutdown();
        throw new Error('User Profile could not be resolved');
      }

    } catch (error) {
      SwrveLogger.errorMsg(error);
      this.onSwrveLoadedCallback(error.toString());
    }
  }

  public static shutdown(): void {
    if (!isNil(this.instance)) {
      const eventQueueManager = this.instance.eventQueueManager;
      if (!isNil(eventQueueManager)) {
        eventQueueManager.shutdown();
      }

      /** Save everything to profile manager at the end */
      this.pageCloseHandler();

      /** Destroy the prototype */
      Object.setPrototypeOf(this.instance, null);
      /** Nullify the object */
      this.instance = null;
    }
  }

  public async initCampaignsAndResources(): Promise<void> {
    this.campaignManager = new ResourceCampaignsManager();
    const infoFromResourcesCampaigns: IInfoForSession | void = await this.campaignManager.getInfoForSession();
    if (infoFromResourcesCampaigns) {
      this.flushConfig = {
        flushFrequency: infoFromResourcesCampaigns.flushFrequency,
        flushRefreshDelay: infoFromResourcesCampaigns.flushRefreshDelay,
      } as IFlushConfig;

      /**  Check if the instance is a qa user */
      this.profile.setQAFlag(infoFromResourcesCampaigns.qa);

      /** Check if we need to retrieve Web Push Keys */
      if (this.config.AutoPushSubscribe) {
        this.webPushAPIKey = infoFromResourcesCampaigns.webPushPublicKey;
      }

      this.campaignManager.init(this.flushConfig);
    }
  }

  /** Called from SwrveSDK */

  /** Send all queued events from queue to Swrve server */
  public sendQueuedEvents(): void {
    const eventQueueManager = new EventQueueManager(this.config, this.flushConfig, this.getUserID, this.sessionToken);
    eventQueueManager.sendEvents();
  }

  /** fetch all events currently in the queue */
  public getQueuedEvents(): any[] {
    return this.localStorageClient.fetchEventsFromQueue(this.getUserID);
  }

  /** Event API */
  public namedEvent(params: INamedEventParams): void {
    if (EventValidator.isValidEventName(params.name)) {
      this.eventInternal(eventTypes.namedEvent, params);
    }
  }

  public sessionStart(): void {
    this.sessionStartInternal();
  }

  public userUpdate(attributes: object): void {
    if (attributes != null) {
      this.userUpdateInternal(eventTypes.userUpdateEvent, attributes);
    } else {
      SwrveLogger.errorMsg('There must be at least one key/value pair, this will not be queued');
    }
  }

  public userUpdateWithDate(params: IUserUpdateWithDateParams): void {
    if (params.name && params.date) {
      this.userUpdateWithDateInternal(eventTypes.userUpdateEvent, params);
    } else {
      SwrveLogger.errorMsg('Both name and date are mandatory, this will not be added to the queue');
    }
  }

  public purchaseEvent (params: IPurchaseParams): void {
    if (params.cost && params.item && params.currency && params.quantity) {
      this.purchaseInternal(params.item, params.currency, params.cost, params.quantity);
    }
  }

  /** Callback Methods */

  public set onSwrveLoaded(callback: OnSwrveLoadedCallback) {
    if (typeof callback !== 'function') {
      SwrveLogger.errorMsg('invalid function');
      return;
    }
    this.onSwrveLoadedCallback = callback;
  }

  /** Private methods */

  /** Private Event Methods */

  private eventInternal(eventType?: EventType, params?: INamedEventParams): void {
    /** Event used internally */
    const queueEntry = this.eventFactory.constructEvent(this.profile.updateSeqnum(),
                                                        this.profile.IsQA,
                                                        new Date().getTime(),
                                                        eventType,
                                                        params.name,
                                                        params.payload);

    this.localStorageClient.storeEventOnQueue(this.getUserID, queueEntry);
  }

  private sessionStartInternal() {
    const queueEntry = this.eventFactory.constructEvent(this.profile.updateSeqnum(),
                                                        this.profile.IsQA,
                                                        new Date().getTime(),
                                                        eventTypes.sessionStartEvent,
    );

    this.localStorageClient.storeEventOnQueue(this.getUserID, queueEntry);
  }

  private userUpdateInternal(eventType: string, attributes: object): void {
    /** UserUpdate used internally */
    const queueEntry = this.eventFactory.constructUserUpdate(this.profile.updateSeqnum(),
                                                             this.profile.IsQA,
                                                             new Date().getTime(),
                                                             attributes);
    this.localStorageClient.storeEventOnQueue(this.getUserID, queueEntry);
  }

  private userUpdateWithDateInternal (type: string, attributes: IUserUpdateWithDateParams): void {
    const seqnum = this.profile.updateSeqnum();
    const queueEntry = this.eventFactory.constructUserUpdateWithDate(seqnum, this.profile.IsQA, new Date().getTime(), attributes.name, attributes.date);
    this.localStorageClient.storeEventOnQueue(this.getUserID, queueEntry);
  }

  private purchaseInternal (item: string, currency: string, cost: number, quantity: number): void {
    const seqnum = this.profile.updateSeqnum();
    const queueEntry = this.eventFactory.constructPurchaseEvent(seqnum, this.profile.IsQA, new Date().getTime(), item, currency, cost, quantity);
    /** we include true here (oddly) to force the queue to flush */
    this.localStorageClient.storeEventOnQueue(this.getUserID, queueEntry);
  }

  private sendClientInfo(): void {
    const seqnum = this.profile.updateSeqnum();
    const properties = ClientInfoHelper.getClientInfo();
    const queueEntry = this.eventFactory.constructDeviceUpdate(seqnum, this.profile.IsQA, new Date().getTime(), properties);

    this.localStorageClient.storeEventOnQueue(this.getUserID, queueEntry);
  }

  private generateSessionToken(): string {
    const time: string = this.sessionStartedAt.toString();
    const md5: Md5 = new Md5();
    md5.appendStr(this.profile.UserId as string)
      .appendStr(time)
      .appendStr(this.config.ApiKey);
    const hash: string = md5.end() as string;

    return `${this.config.AppID}=${this.profile.UserId}=${time}=${hash}`;
  }

  private hasSessionRestored(): boolean {
    if (this.profile.LastSession != null) {
      SwrveLogger.infoMsg('LastSession: ' + this.profile.LastSession);
      const lastSession: number = this.profile.LastSession;
      const now: number = new Date().getTime();
      const expirationTimeout: number = this.config.NewSessionInterval * 1000; /** convert to ms */
      if (!lastSession || now - lastSession > expirationTimeout) {
        return false;
      }
      /** the session hasn't expired so keep the last session time as the session start */
      SwrveLogger.infoMsg('Session is still going, restoring last session');
      this.sessionStartedAt = this.profile.LastSession;
      return true;
    }
    return false;
  }

  // Install Date
  private getPersistentInstallDate(): string {
    return this.localStorageClient.fetchInstallDate();
  }

  private hasPersistentInstallDate(): boolean {
    /* tslint:disable-next-line:triple-equals */
    return !(this.getPersistentInstallDate() == undefined);
  }

  private setPersistentInstallDate(): void {
    const persistentDate = new Date(Date.now());
    SwrveLogger.infoMsg('Setting Install Date:' + persistentDate);
    this.localStorageClient.storeInstallDate(DateHelper.dateToSwrveYYYYMMDDFormat(persistentDate));
  }

  // DeviceID
  private getPersistentDeviceId(): string {
    return this.localStorageClient.fetchDeviceID();
  }

  private hasPersistentDeviceId(): boolean {
    /* tslint:disable-next-line:triple-equals */
    return !(this.getPersistentDeviceId() == undefined);
  }

  private setPersistentDeviceId(): void {
    const uniqueDeviceId = generateUuid();
    SwrveLogger.infoMsg(`Setting device id: ${uniqueDeviceId}`);
    this.localStorageClient.storeDeviceID(uniqueDeviceId.toString());
  }

  // Browser/DOM Lifecycle
  private static pageCloseHandler(): void {
    /** Store all data before page close */
    if (this.instance !== null) {
      this.instance.profile.saveBeforeSessionEnd();
    }
  }
}

export default Swrve;
