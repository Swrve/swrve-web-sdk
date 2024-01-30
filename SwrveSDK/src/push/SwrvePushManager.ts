import { ISwrveSDKConfig } from "../interfaces/ISwrveSDKConfig";
import {SwrveSDK} from "../SwrveSDK";
import { IPushEvent } from "@swrve/web-core";
import { base64UrlToUint8Array } from "../util/Array";
import { isNil, isPresent, noOp } from "../util/Nil";
import SwrveLogger from "../util/SwrveLogger";

export const serviceWorkerEventTypes = {
  swrvePushNotificationClicked: "swrve.push_clicked",
  swrvePushNotificationClosed: "swrve.push_closed",
  swrvePushReceived: "swrve.push_received",
};

class SwrvePushManager {
  private _isInitialized: boolean = false;
  private _eventFlushFreqency: number = 30000;
  private _pushEventLoopTimer: any;
  private _webPushToken: string;
  private _webPushApiKey: string;
  private _userId: string;
  private _config: ISwrveSDKConfig;
  private callBackPushReceived: (event: any) => void;
  private callBackPushClicked: (event: any) => void;
  private callBackPushClosed: (event: any) => void;

  public constructor(
    config: ISwrveSDKConfig,
    onPushReceived?: () => void,
    onPushClicked?: () => void,
    onPushClosed?: () => void
  ) {
    this._config = config;
    this.callBackPushReceived = onPushReceived || noOp;
    this.callBackPushClicked = onPushClicked || noOp;
    this.callBackPushClosed = onPushClosed || noOp;
  }

  public get IsInitialized(): boolean {
    return this._isInitialized;
  }

  public get WebPushApiKey(): string {
    return this._webPushApiKey;
  }

  public init(webPushApiKey: string, userId: string) {
    if (this.IsInitialized) {
      SwrveLogger.debug("SwrvePushManager :: Already Initialized");
      return;
    }

    if (!this.isPushSupported()) {
      SwrveLogger.debug("SwrvePushManager :: Push is not supported");
      return;
    }

    this._webPushApiKey = webPushApiKey;
    this._userId = userId;
    this._isInitialized = true;
    // On initialisation check that a service worker is registered; on app
    // launch this might not yet be registered unless register has been called.
    navigator.serviceWorker.getRegistration(this._config.serviceWorker)
                           .then((existingRegistration) => {
                              // There is no subscription, user has likly unregistered or
                              // never registered for push.
                              if (isNil(existingRegistration)) { return; }
                              
                              this.syncServiceWorkerThread();
                              this.registerPushListeners();
                              
                              existingRegistration.pushManager.getSubscription().then((existingSubscription) => {
                                if (existingSubscription) {
                                  this.sendPushRegistrationProperties(existingSubscription);
                                } else {
                                  this.sendBrowserPermissions();
                                }
                              }).catch(error => {
                                SwrveLogger.warn(`Error sending in subscription properties.\n ${error}`);
                              });
                           }).catch(error => {
                              SwrveLogger.warn(`Push registration not found; unable to sync with worker.\n ${error}`);
                           });
  }

  public async registerPush(
    onSuccess: () => void = noOp,
    onFailure: (err: Error) => void = noOp
  ): Promise<void> {
    if (!this.isPushSupported()) {
      /* Unsupported browser: exiting quietly */
      return;
    }

    try {
      SwrveLogger.debug(`Registering service worker: ${this._config.serviceWorker}`);
      const registration = await navigator.serviceWorker.register(this._config.serviceWorker)
      SwrveLogger.debug("Installing and registering...", registration);

      const serviceWorkerRegistration = await navigator.serviceWorker.ready;
      const existingSubscription = await serviceWorkerRegistration.pushManager.getSubscription();

      if (isNil(existingSubscription)) {
        SwrveLogger.debug("Attempting to subscribe to push");

        const keyArray = base64UrlToUint8Array(this.WebPushApiKey);
        const options = {
          applicationServerKey: keyArray,
          userVisibleOnly: this._config.userVisibleOnly,
        };

        const newSubscription = await serviceWorkerRegistration.pushManager.subscribe(options);
        this.sendPushRegistrationProperties(newSubscription);

        SwrveLogger.debug("Subscribed Successfully");
      } else {
        SwrveLogger.debug("Already subscribed to push");
        this.sendPushRegistrationProperties(existingSubscription);
      }
      this.syncServiceWorkerThread();
      this.registerPushListeners();
      onSuccess();
    } catch (error) {
      SwrveLogger.error("Error during registration and subscription", error);
      onFailure(error);
    }
  }

  public async unregisterPush(
    onSuccess: () => void = noOp,
    onFailure: (err: Error) => void = noOp
  ): Promise<void> {
    if (!this.isPushSupported()) {
      // ** Unsupported browser: exiting quietly */
      return;
    }
    this.check();

    try {
      const serviceWorkerRegistration = await navigator.serviceWorker.getRegistration(this._config.serviceWorker);
      const existingSubscription = await serviceWorkerRegistration.pushManager.getSubscription();
      if (isNil(existingSubscription)) {
        throw new Error("Could not unregister push. No subscription found");
      }

      await existingSubscription.unsubscribe();
      await serviceWorkerRegistration.unregister();

      this.shutdown();

      onSuccess();
    } catch (error) {
      SwrveLogger.warn(`Could not unregister push. ${error}`);
      onFailure(error);
    }
  }

  public async syncServiceWorkerThread(): Promise<void> {
    try {
      SwrveLogger.debug("Syncing with service worker.")
      let user = await this.setPushSession();
      SwrveLogger.debug(`Push session started for user ${user}`);

      clearInterval(this._pushEventLoopTimer); // remove any previously set flush threads

      SwrveLogger.debug("Setting background thread for push events flusher.");
      this._pushEventLoopTimer = setInterval(() => {
        this.flushPushEventQueue()
      }, this._eventFlushFreqency);
    } catch (error) {
      SwrveLogger.error('Error setting push session:', error);
    }
  }

  public isPushSupported() {
    return "serviceWorker" in navigator && "PushManager" in window;
  }

  public shutdown() {
    if (this._pushEventLoopTimer) {
      clearInterval(this._pushEventLoopTimer);
    }
  }

  private registerPushListeners(): void {
    navigator.serviceWorker.removeEventListener("message", this.pushHandler); // Remove any existing push listeners to avoid duplicates
    navigator.serviceWorker.addEventListener(
      "message",
      ((event: any) => {
        this.pushHandler(event);
      }).bind(this),
      false
    );
  }

  private pushHandler(event: any): void {
    SwrveLogger.debug("PushManager received message event");
    SwrveLogger.debug(event);
    const { data } = event;
    if (isNil(data)) {
      SwrveLogger.error("Could not parse message from service worker");
      return;
    }
    switch (data.type) {
      case serviceWorkerEventTypes.swrvePushReceived:
        this.callBackPushReceived(event);
        break;
      case serviceWorkerEventTypes.swrvePushNotificationClicked:
        this.callBackPushClicked(event);
        break;
      case serviceWorkerEventTypes.swrvePushNotificationClosed:
        this.callBackPushClosed(event);
        break;
    }
  }

  private check(): void {
    if (!this.IsInitialized) {
      throw new Error("SwrvePushManager Not Initialized!");
    }
  }

  private sendPushRegistrationProperties(
    pushSubscription: PushSubscription
  ): void {
    const subscription = pushSubscription.toJSON();
    const auth = subscription.keys.auth;
    const p256dh = subscription.keys.p256dh;
    const endpoint = subscription.endpoint;
    this._webPushToken = `${endpoint}|${p256dh}|${auth}`;
    SwrveLogger.debug(
      `sending push registration properties : ${this._webPushToken}`
    );
    SwrveLogger.debug("sending push subscription", subscription);
    SwrveSDK.checkCoreInstance().deviceUpdate({ "swrve.web_push_token": this._webPushToken })
    this.sendBrowserPermissions();
  }

  private async sendBrowserPermissions() {
    if (this.browserHasPermissionsAccess()) {
      await navigator.permissions
        .query({ name: "notifications" })
        .then((permissionStatus) => {
          SwrveLogger.debug(
            `notifications permission status is  ${permissionStatus.state}`
          );
          SwrvePushManager.sendPermissionsUpdate(permissionStatus.state);
          permissionStatus.onchange = function () {
            SwrveLogger.debug(
              `notifications permission status has changed to ${this.state}`
            );
            SwrvePushManager.sendPermissionsUpdate(this.state);
          };
        });
    } else {
      SwrveLogger.warn("notifications permission status is unknown");
      SwrvePushManager.sendPermissionsUpdate("unknown");
    }
  }

  private async flushPushEventQueue() {
    try {
      const events: IPushEvent[] = await this.fetchPushEvents();
      if (events.length > 0) {
        SwrveLogger.debug(`Flushing push events: ${events}`)
        SwrveSDK.checkCoreInstance().enqueuePushEvents(events);
      }
    } catch (error) {
      SwrveLogger.error('Error fetching or processing push events:', error);
    }
  }

  private fetchPushEvents(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        if (!this.isPushSupported()) {
          throw new Error('Failed to fetch push data, push is not supported!');
        }
        this.check();

        const registration = await navigator.serviceWorker.ready;
        const messageChannel = new MessageChannel();

        messageChannel.port1.onmessage = (event) => {
          if (event.data && event.data.type === 'pushData') {
            resolve(event.data.data);
          }
        };

        registration.active.postMessage({
          type: 'fetchPushData',
          user_id: this._userId,
          port: messageChannel.port2,
        }, [messageChannel.port2]);
      } catch (error) {
        reject(error);
      }
    });
  }

  private setPushSession(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        if (!this.isPushSupported()) {
          throw new Error('Failed to fetch push data, push is not supported!');
        }
        this.check();

        const registration = await navigator.serviceWorker.ready;
        const messageChannel = new MessageChannel();

        messageChannel.port1.onmessage = (event) => {
          if (event.data && event.data.type === 'userSession') {
            resolve(event.data.data);
          }
        };

        registration.active.postMessage({
          type: 'setUserSession',
          user_id: this._userId,
        }, [messageChannel.port2]);
      } catch (error) {
        reject(error);
      }
    });
  }

  private browserHasPermissionsAccess(): boolean {
    return navigator.permissions !== undefined;
  }

  private static sendPermissionsUpdate(state: string) {
    SwrveSDK.checkCoreInstance().deviceUpdate({ "swrve.permission.web.push_notifications": state })
  }
}

export default SwrvePushManager;
