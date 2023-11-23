import { ISwrveSDKConfig } from "../interfaces/ISwrveSDKConfig";
import {SwrveSDK} from "../SwrveSDK";
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
  private _webPushToken: string;
  private _webPushApiKey: string;
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

  public init(webPushApiKey: string) {
    if (this.IsInitialized) {
      SwrveLogger.debug("SwrvePushManager :: Already Initialized");
      return;
    }

    if (!this.isPushSupported()) {
      SwrveLogger.debug("SwrvePushManager :: Push is not supported");
      return;
    }

    this._webPushApiKey = webPushApiKey;
    this._isInitialized = true;
  }

  public registerPush(
    onSuccess: () => void = noOp,
    onFailure: (err: Error) => void = noOp
  ) {
    if (!this.isPushSupported()) {
      // ** Unsupported browser: exiting quietly */
      return;
    }
    this.check();

    navigator.serviceWorker
      .register(this._config.serviceWorker)
      .then((serviceWorkerRegistration) => {
        SwrveLogger.debug(
          `Registering service worker: ${this._config.serviceWorker}`
        );
        SwrveLogger.debug("Registering..", serviceWorkerRegistration);

        serviceWorkerRegistration.pushManager
          .getSubscription()
          .then((existingSubscription) => {
            if (isNil(existingSubscription)) {
              SwrveLogger.debug("Attempting to subscribe to push");
              const keyArray = base64UrlToUint8Array(this.WebPushApiKey);
              const options = {
                applicationServerKey: keyArray,
                userVisibleOnly: this._config.userVisibleOnly,
              };

              serviceWorkerRegistration.pushManager
                .subscribe(options)
                .then((newSubscription) => {
                  this.sendPushRegistrationProperties(newSubscription);
                  SwrveLogger.debug("Subscribed Successfully");
                  onSuccess();
                })
                .catch((error) => {
                  SwrveLogger.error("Subscription to push failed", error);
                  onFailure(error);
                });
            } else {
              SwrveLogger.debug("Already subscribed to push");
              this.sendPushRegistrationProperties(existingSubscription);
              onSuccess();
              return;
            }
          })
          .catch((error) => {
            SwrveLogger.error(
              "Cannot get Push Subscription Information",
              error
            );
            onFailure(error);
          });
      });
    this.registerPushListeners();
  }

  public unregisterPush(
    onSuccess: () => void = noOp,
    onFailure: (err: Error) => void = noOp
  ) {
    if (!this.isPushSupported()) {
      // ** Unsupported browser: exiting quietly */
      return;
    }
    this.check();

    navigator.serviceWorker.ready.then((serviceWorkerRegistration) => {
      serviceWorkerRegistration.pushManager
        .getSubscription()
        .then((existingSubscription) => {
          if (isNil(existingSubscription)) {
            SwrveLogger.warn(
              "Could not unregister push. No subscription found"
            );
            return;
          }

          existingSubscription
            .unsubscribe()
            .then(() => {
              /** This part disables the service workers for this page, probably not necessary - UPDATE For whatever reason, if we don't do this the push goes stale and can't be resent.
               * We can't leave this in long term
               *  TODO: Investigate this
               */
              navigator.serviceWorker
                .getRegistrations()
                .then((registrations) => {
                  for (const registration of registrations) {
                    SwrveLogger.debug(
                      "Unregistering from Service Worker",
                      registration
                    );
                    registration.unregister();
                  }
                });
              onSuccess();
            })
            .catch((error) => {
              SwrveLogger.error("Error unsubscribing from push", error);
              onFailure(error);
            });
        })
        .catch((error) => {
          SwrveLogger.error("Error fetching existing subscription", error);
          onFailure(error);
        });
    });
  }

  public isPushSupported() {
    return "serviceWorker" in navigator && "PushManager" in window;
  }

  public onPushReceived(event: any) {
    SwrveLogger.debug("Notification Received");

    if (isPresent(event.data) && isPresent(event.data.body.id)) {
      SwrveSDK.checkCoreInstance().notificationDeliveredEvent(
        event.data.body.id
      );
    }

    return this.callBackPushReceived(event);
  }

  public onPushClicked(event: any): void {
    SwrveLogger.debug(`Notification Clicked \n${event}`);

    if (isPresent(event.data) && isPresent(event.data.body.id)) {
      SwrveSDK.checkCoreInstance().notificationEngagedEvent(event.data.body.id);
    }

    return this.callBackPushClicked(event);
  }

  public onPushClosed(event: any): void {
    SwrveLogger.debug("Notification Closed");

    return this.callBackPushClosed(event);
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
        this.onPushReceived(event);
        break;
      case serviceWorkerEventTypes.swrvePushNotificationClicked:
        this.onPushClicked(event);
        break;
      case serviceWorkerEventTypes.swrvePushNotificationClosed:
        this.onPushClosed(event);
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
    this.sendBrowserPermissions(pushSubscription);
  }

  private async sendBrowserPermissions(pushSubscription: PushSubscription) {
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

  private static sendPermissionsUpdate(state: string) {
    SwrveSDK.checkCoreInstance().deviceUpdate({ "swrve.permission.web.push_notifications": state })
  }

  private browserHasPermissionsAccess(): boolean {
    return navigator.permissions !== undefined;
  }
}

export default SwrvePushManager;
