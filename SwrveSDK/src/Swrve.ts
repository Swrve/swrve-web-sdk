
import { Md5 } from 'ts-md5';
import SwrveConfig from './config/SwrveConfig';
import EventFactory from './events/EventFactory';
import EventValidator from './events/EventValidator';
import DateHelper from './helpers/DateHelper';
import {
  EventType,
  eventTypes,
  firstSessionEventName,
  ICurrencyParams,
  IGenericCampaignEventParams,
  IIAPParams,
  INamedEventParams,
  IPurchaseParams,
  IRewardsParams,
  IUserUpdateClientInfoAttributes,
  IUserUpdateWithDateParams,
  StorableEvent,
} from './interfaces/IEvents';
import { IInfoForSession } from './interfaces/IResourcesCampaigns';
import { IFlushConfig, ISwrveConfig } from './interfaces/ISwrveConfig';
import ResourceCampaignsManager from './ResourceCampaignsManager';
import { isNil, isPresent, noOp } from './util/Nil';
import SwrveLogger from './util/SwrveLogger';

import { defaultFlushFrequency, defaultFlushRefreshDelay } from './config/AppConfigParams';
import EventQueueManager from './events/EventQueueManager';

import ClientInfoHelper from './helpers/ClientInfoHelper';
import SupportHelper from './helpers/SupportHelper';
import SwrveProfile from './profile/SwrveProfile';
import SwrvePushManager from './push/SwrvePushManager';

import LocalStorageClient from './storage/LocalStorageClient';
import { OnSwrveLoadedCallback } from './SwrveSDK';
import { generateUuid } from './util/Uuid';
import { nowInUtcTime } from './util/Date';

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
  private swrvePushManager: SwrvePushManager;
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

  public get SwrvePushManager(): SwrvePushManager {
    return this.swrvePushManager;
  }

  public get DeviceId(): string {
    return this.getPersistentDeviceId();
  }

  public get getUserID(): string {
    SwrveLogger.infoMsg('UserID Returned:');
    SwrveLogger.infoMsg(this.profile.UserId);
    return this.profile.UserId;
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
    if (!SupportHelper.isTrackingSupported()) {
      throw Error('The configuration shown in the User Agent is not officially supported');
    }

    SwrveLogger.infoMsg('Starting New SwrveSDK instance');
    this.initializePersistentData();

    /** Start up the profile */
    try {
      await this.initializeIdentity();

      if (this.profile.IsIdentityResolved) {
        SwrveLogger.infoMsg(`Profile Resolved: ${this.profile.UserId} for extUserId: ${this.profile.ExternalUserId}`);

        /** check if we need to start a new session or restore an old one */
        if (!this.hasSessionRestored()) {
          // Send a session start event
          this.sessionStartedAt = nowInUtcTime(); /** session startedAt in ms */
          this.sessionStart();
        }

        SwrveLogger.infoMsg('Generating Session Token');
        this.sessionToken = this.generateSessionToken();

        /** call the getCampaignsAndResources request to get flush_frequency */
        SwrveLogger.infoMsg('Fetching synchronous campaigns and resources');
        await this.initCampaignsAndResources();

        /** start an async function to flush events */
        SwrveLogger.infoMsg('Initializing event Manager');
        this.eventQueueManager = new EventQueueManager(this.config, this.flushConfig, this.getUserID, this.sessionToken);
        this.eventQueueManager.init();

        /** determines from the profile resolved if there has been a session before */
        if (this.profile.LastSession == null) {
          this.eventInternal(eventTypes.namedEvent, { name: firstSessionEventName });
        }

        /** Send User Properties */
        SwrveLogger.infoMsg('Sending Client Info');
        this.sendClientInfo();

        /** Initialize Push Manager but do not register */
        SwrveLogger.infoMsg(`Initializing PushManager with WebPushAPIKey: ${this.WebPushAPIKey}`);
        this.swrvePushManager = new SwrvePushManager(this.config, this.WebPushAPIKey);
        this.SwrvePushManager.init();

        /** Setup push configuration */
        if (!this.config.AutoPushSubscribe) {
          SwrveLogger.infoMsg('SwrvePushManager Will not initialize. Auto subscribe is disabled');
        } else {
          SwrveLogger.infoMsg('autoPushSubscribe: ON');
          this.swrvePushManager.registerPush();
        }

        window.onbeforeunload = (): void => { Swrve.pageStateHandler(); };
        window.onblur = (): void => { Swrve.pageStateHandler(); };

        /** inform the customer that Swrve has loaded */
        if (isPresent(this.onSwrveLoadedCallback)) {
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
      this.pageStateHandler();

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

      /** Check if there is a web push key to be used */
      if (infoFromResourcesCampaigns.webPushPublicKey) {
        this.webPushAPIKey = infoFromResourcesCampaigns.webPushPublicKey;
      }

      this.campaignManager.init(this.flushConfig);
    }
  }

  public registerPush(onSuccess: () => void, onFailure: (error: Error) => void): void {
    this.swrvePushManager.registerPush(onSuccess, onFailure);
  }

  public unregisterPush(onSuccess: () => void, onFailure: (err: Error) => void): void {
    this.swrvePushManager.unregisterPush(onSuccess, onFailure);
  }

  /** Called from SwrveSDK */

  /** Send all queued events from queue to Swrve server */
  public sendQueuedEvents(): void {
    this.eventQueueManager.sendEvents();
  }

  /** fetch all events currently in the queue */
  public getQueuedEvents(): StorableEvent[] {
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

  public userUpdate(attributes: IUserUpdateClientInfoAttributes): void {
    if (attributes != null) {
      this.userUpdateInternal(attributes);
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

  public genericCampaignEvent(params: IGenericCampaignEventParams): void {
    if (params.actionType && params.campaignType && params.campaignId && params.id) {
      this.genericCampaignEventInternal({
        actionType: params.actionType,
        campaignId: params.campaignId,
        campaignType: params.campaignType,
        id: params.id,
      });
    }
  }

  public pushNotificationEngagedEvent(campaignId: number, deeplink?: string): void {
    const eventName = `Swrve.Messages.Push-${campaignId}.engaged`;
    const queueEntry = this.eventFactory.constructEvent(this.profile.updateSeqnum(),
                                                        nowInUtcTime(),
                                                        'event',
                                                        eventName);
    const events = [queueEntry];

    if (this.profile.IsQA) {
      const qaEntry = this.eventFactory.constructQANotificationEngagedEvent(queueEntry, campaignId, deeplink);
      events.push(qaEntry);
    }

    this.queueEvents(events);
  }

  public currencyGiven (params: ICurrencyParams): void {
    if (params.currency && params.amount) {
      this.currencyGivenInternal({ currency: params.currency, amount: params.amount });
    }
  }

  public iapEvent (params: IIAPParams): void {
    if (params.cost && params.local_currency && params.quantity && params.product_id) {
      this.iapInternal(params.rewards, params.local_currency, params.cost, params.quantity, params.product_id);
    } else {
      SwrveLogger.infoMsg('Missing expected parameter');
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

  /** Initialization Methods */

  private async initializeIdentity() {
    SwrveLogger.infoMsg('Setting up profile');
    this.profile = new SwrveProfile(this.config.ExternalUserId);
    if (!this.profile.IsIdentityResolved) {
      await this.profile.callIdentifyOnExternalUserId(this.config.ExternalUserId, this);
      if (this.profile.IsIdentityResolved) {
        SwrveLogger.infoMsg(`Identify Resolved: ${this.profile.UserId} for extUserId: ${this.profile.ExternalUserId}`);
      }
    }
  }

  private initializePersistentData() {
    if (!this.hasPersistentInstallDate()) {
      this.sessionStartedAt = nowInUtcTime(); /** session startedAt in ms */
      this.setPersistentInstallDate();
    }
    if (!this.hasPersistentDeviceId()) {
      this.setPersistentDeviceId();
    }
  }

  /** Private Event Methods */
  private queueEvents(events: any[]) { // For some reason, StorableType is not accepted here.
    events.forEach((event) => {
      this.localStorageClient.storeEventOnQueue(this.getUserID, event);
    });
    this.shouldSendEventsImmediately() ? this.eventQueueManager.sendEvents() : noOp();
  }

  private shouldSendEventsImmediately() {
    return this.profile.IsQA && !isNil(this.eventQueueManager);
  }

  private eventInternal(eventType?: EventType, params?: INamedEventParams): void {
    /** Event used internally */
    const queueEntry = this.eventFactory.constructEvent(this.profile.updateSeqnum(),
                                                        nowInUtcTime(),
                                                        eventType,
                                                        params.name,
                                                        params.payload);
    const events = [queueEntry];
    if (this.profile.IsQA) {
      const qaEntry = this.eventFactory.constructQAEvent(queueEntry);
      events.push(qaEntry);
    }

    this.queueEvents(events);
  }

  private genericCampaignEventInternal(params: IGenericCampaignEventParams) {
    const queueEntry = this.eventFactory.constructGenericCampaignEvent(
      this.profile.updateSeqnum(),
      new Date().getTime(),
      params.campaignType,
      params.campaignId,
      params.id,
      params.actionType,
    );

    this.queueEvents([queueEntry]);
  }

  private currencyGivenInternal(params: ICurrencyParams) {
    const queueEntry = this.eventFactory.constructCurrencyGiven(this.profile.updateSeqnum(),
                                                                nowInUtcTime(),
                                                                params.currency,
                                                                params.amount,
    );
    const events = [queueEntry] as StorableEvent[];

    if (this.profile.IsQA) {
      const qaEntry = this.eventFactory.constructQACurrencyGiven(queueEntry);
      events.push(qaEntry);
    }

    this.queueEvents(events);
  }

  private sessionStartInternal() {
    const queueEntry = this.eventFactory.constructSessionStart(this.profile.updateSeqnum(), nowInUtcTime());
    const events = [queueEntry];

    if (this.profile.IsQA) {
      events.push(this.eventFactory.constructQASessionStart(queueEntry));
    }

    this.queueEvents(events);
  }

  /** UserUpdate used internally */
  private userUpdateInternal(attributes: IUserUpdateClientInfoAttributes): void {
    const queueEntry = this.eventFactory.constructUserUpdate(this.profile.updateSeqnum(),
                                                             nowInUtcTime(),
                                                             attributes);
    const events = [queueEntry];
    if (this.profile.IsQA) {
      events.push(this.eventFactory.constructQAUserUpdate(queueEntry));
    }

    this.queueEvents(events);
  }

  private userUpdateWithDateInternal(type: string, attributes: IUserUpdateWithDateParams): void {
    const seqnum = this.profile.updateSeqnum();
    const queueEntry = this.eventFactory.constructUserUpdateWithDate(seqnum, nowInUtcTime(), attributes.name, attributes.date);
    const events = [] as StorableEvent[];
    events.push(queueEntry);
    if (this.profile.IsQA) {
      events.push(this.eventFactory.constructQAUserUpdateWithDate(queueEntry));
    }

    this.queueEvents(events);
  }

  private purchaseInternal(item: string, currency: string, cost: number, quantity: number): void {
    const seqnum = this.profile.updateSeqnum();
    const queueEntry = this.eventFactory.constructPurchaseEvent(seqnum, nowInUtcTime(), item, currency, cost, quantity);
    const events = [] as StorableEvent[];
    events.push(queueEntry);
    if (this.profile.IsQA) {
      events.push(this.eventFactory.constructQAPurchaseEvent(queueEntry));
    }

    this.queueEvents(events);
  }

  private iapInternal(rewards: { [id: string]: IRewardsParams; }, localCurrency: string, cost: number, quantity: number, productId: string): void {
    const seqnum = this.profile.updateSeqnum();
    const queueEntry = this.eventFactory.constructIAPEvent(seqnum, nowInUtcTime(), rewards, localCurrency, cost, quantity, productId);
    const events = [] as StorableEvent[];
    events.push(queueEntry);
    if (this.profile.IsQA) {
      events.push(this.eventFactory.constructQAIAPEvent(queueEntry));
    }

    this.queueEvents(events);
  }

  private sendClientInfo(): void {
    const seqnum = this.profile.updateSeqnum();
    const properties = ClientInfoHelper.getClientInfo();
    const queueEntry = this.eventFactory.constructDeviceUpdate(seqnum, nowInUtcTime(), properties);
    const events = [queueEntry];

    if (this.profile.IsQA) {
      events.push(this.eventFactory.constructQADeviceUpdate(queueEntry));
    }

    this.queueEvents(events);
  }

  private generateSessionToken(): string {
    const time: string = this.sessionStartedAt.toString();
    const md5: Md5 = new Md5();
    md5.appendStr(this.profile.UserId)
      .appendStr(time)
      .appendStr(this.config.ApiKey);
    const hash: string = md5.end() as string;

    return `${this.config.AppID}=${this.profile.UserId}=${time}=${hash}`;
  }

  private hasSessionRestored(): boolean {
    if (this.profile.LastSession != null) {
      SwrveLogger.infoMsg('LastSession');
      SwrveLogger.infoMsg(this.profile.LastSession);
      const lastSession: number = Number(this.profile.LastSession);
      SwrveLogger.infoMsg(`lastSession: ${lastSession}`);
      const now: number = Number(nowInUtcTime());
      SwrveLogger.infoMsg(`now: ${now}`);
      const expirationTimeout: number = this.config.NewSessionInterval * 1000; /** convert to ms */
      const diffTime: number = now - lastSession
      SwrveLogger.infoMsg(`Diff now - lastSession: ${diffTime}`);
      if (lastSession && diffTime > expirationTimeout) {
        SwrveLogger.infoMsg('session has expired. returning false');
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
    return isPresent(this.getPersistentInstallDate());
  }

  private setPersistentInstallDate(): void {
    const persistentDate = DateHelper.dateToUTCDate(new Date(Date.now()));
    SwrveLogger.infoMsg('Setting Install Date:');
    SwrveLogger.infoMsg(persistentDate);
    this.localStorageClient.storeInstallDate(DateHelper.dateToSwrveYYYYMMDDFormat(persistentDate));
  }

  // DeviceID
  private getPersistentDeviceId(): string {
    return this.localStorageClient.fetchDeviceID();
  }

  private hasPersistentDeviceId(): boolean {
    /* tslint:disable-next-line:triple-equals */
    return isPresent(this.getPersistentDeviceId());
  }

  private setPersistentDeviceId(): void {
    const uniqueDeviceId = generateUuid();
    SwrveLogger.infoMsg(`Setting device id: ${uniqueDeviceId}`);
    this.localStorageClient.storeDeviceID(uniqueDeviceId.toString());
  }

  // Browser/DOM Lifecycle
  private static pageStateHandler(): void {
    /** Store all data before page close or focus out */
    if (this.instance !== null) {
      this.instance.profile.saveBeforeSessionEnd();
    }
  }
}

export default Swrve;
