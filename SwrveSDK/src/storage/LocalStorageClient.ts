import { IEventDBData } from '../interfaces/IEvents';
import { ExternalUserNamespaceKeys, GlobalNamespaceKeys, UserNamespaceKeys } from './LocalStorageSchema';
import StorageManager from './StorageManager';

class LocalStorageClient {
  private storageManager: StorageManager;

  public constructor() {
    this.storageManager = new StorageManager();
  }

  /* Global */
  public storeInstallDate(value: string) {
    return this.storageManager.writeLocal(GlobalNamespaceKeys.InstallDate, value.toString());
  }
  public fetchInstallDate(): string {
    const installDate = this.storageManager.readLocal(GlobalNamespaceKeys.InstallDate);
    return installDate ? installDate.toString() : undefined;
  }

  public storeDeviceID(value: string) {
    return this.storageManager.writeLocal(GlobalNamespaceKeys.DeviceID, value);
  }
  public fetchDeviceID(): string {
    return this.storageManager.readLocal(GlobalNamespaceKeys.DeviceID);
  }

  /* External User Namespace */
  public storeUserID(externalUserID: string, value: string) {
    return this.storageManager.writeLocal(this.userIDKey(externalUserID), value);
  }
  public fetchUserID(externalUserID: string): string {
    return this.storageManager.readLocal(this.userIDKey(externalUserID));
  }

  /* User Namespace */
  // Etag
  public storeLastETag(userID: string, value: string) {
    return this.storageManager.writeLocal(this.lastETagKey(userID), value);
  }
  public fetchLastETag(userID: string): string {
    return this.storageManager.readLocal(this.lastETagKey(userID));
  }

  // Sessions
  public storeFirstSession(userID: string, value: number) {
    return this.storageManager.writeLocal(this.firstSessionKey(userID), value);
  }
  public fetchFirstSession(userID: string): number {
    const firstSession = this.storageManager.readLocal(this.firstSessionKey(userID));
    return firstSession ? +firstSession as number : undefined;
  }

  public storeLastSession(userID: string, value: number) {
    return this.storageManager.writeLocal(this.lastSessionKey(userID), value);
  }
  public fetchLastSession(userID: string): number {
    const lastSession = this.storageManager.readLocal(this.lastSessionKey(userID));
    return lastSession ? +lastSession as number : undefined;
  }

  // Seqnum
  public storeSeqnum(userID: string, value: number) {
    return this.storageManager.writeLocal(this.seqnumKey(userID), value);
  }
  public fetchSeqnum(userID: string): number {
    return +this.storageManager.readLocal(this.seqnumKey(userID)) as number; // 0 if undefined
  }

  // FlushFrequency
  public storeLastFlushFrequency(userID: string, value: number) {
    return this.storageManager.writeLocal(this.lastFlushFrequency(userID), value);
  }

  public fetchLastFlushFrequency(userID: string): number {
    return this.storageManager.readLocal(this.lastFlushFrequency(userID));
  }

  // FlushRefreshDelay
  public storeLastFlushRefreshDelay(userID: string, value: number) {
    return this.storageManager.writeLocal(this.lastFlushRefreshDelay(userID), value);
  }

  public fetchLastFlushRefreshDelay(userID: string): number {
    return this.storageManager.readLocal(this.lastFlushRefreshDelay(userID));
  }

  // WebPushAPIKey
  public storeLastWebPushPublicKey(userID: string, value: string) {
    return this.storageManager.writeLocal(this.lastWebPushPublicKey(userID), value);
  }

  public fetchLastWebPushPublicKey(userID: string): string {
    return this.storageManager.readLocal(this.lastWebPushPublicKey(userID));
  }

  // QAStatus
  public storeQAStatus(userID: string, value: boolean) {
    return this.storageManager.writeLocal(this.qaStatus(userID), value);
  }
  public fetchQAStatus(userID: string): boolean {
    return this.storageManager.readLocal(this.qaStatus(userID));
  }

  // Events
  public storeEventOnQueue(userID: string, event: IEventDBData) {
    return this.storageManager.writeLocal(this.eventsQueueKey(userID), event);
  }

  public fetchEventKeys(userID: string): string[] {
    return this.storageManager.localKeys().filter(key => key.startsWith(this.eventsQueueKeyPrefix(userID)));
  }

  public fetchEventsFromQueue(userID: string): IEventDBData[] {
    const keys = this.fetchEventKeys(userID);
    const events = [];
    keys.forEach((key) => {
      events.push(this.fetchEventFromQueue(key));
    });
    return events;
  }

  public fetchEventFromQueue(key: string) {
    return this.storageManager.readLocal(key);
  }

  public deleteEventOnQueue(key: string) {
    this.storageManager.deleteLocal(key);
  }

  /* Keys */
  private userIDKey(externalUserID) { return `swrve:${externalUserID}:${ExternalUserNamespaceKeys.UserID}`; }
  private firstSessionKey(userID) { return `swrve:${userID}:${UserNamespaceKeys.FirstSession}`; }
  private lastSessionKey(userID) { return `swrve:${userID}:${UserNamespaceKeys.LastSession}`; }
  private seqnumKey(userID) { return `swrve:${userID}:${UserNamespaceKeys.Seqnum}`; }
  private lastETagKey(userID) { return `swrve:${userID}:${UserNamespaceKeys.LastETag}`; }
  private lastFlushFrequency(userID) { return `swrve:${userID}:${UserNamespaceKeys.LastFlushFrequency}`; }
  private lastFlushRefreshDelay(userID) { return `swrve:${userID}:${UserNamespaceKeys.LastFlushRefreshDelay}`; }
  private lastWebPushPublicKey(userID) { return `swrve:${userID}:${UserNamespaceKeys.LastWebPushPublicKey}`; }
  private qaStatus(userID) { return `swrve:${userID}:${UserNamespaceKeys.QAStatus}`; }
  private eventsQueueKey(userID) { return `${this.eventsQueueKeyPrefix(userID)}:${this.eventsQueueKeyStamp()}`; }
  private eventsQueueKeyPrefix(userID) { return `swrve:${userID}:${UserNamespaceKeys.Events}`; }
  private eventsQueueKeyStamp() { return `${Date.now()}-${window.performance.now()}-${Math.random()}`; }
}

export default LocalStorageClient;
