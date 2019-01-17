import SwrveConfig from '../config/SwrveConfig';
import SwrveSDK from '../SwrveSDK';
import { base64UrlToUint8Array } from '../util/Array';
import { isNil, isPresent, noOp } from '../util/Nil';
import SwrveLogger from '../util/SwrveLogger';

export const serviceWorkerEventTypes = {
  swrvePushNotificationClicked: 'swrve.push_clicked',
  swrvePushNotificationClosed: 'swrve.push_closed',
  swrvePushReceived: 'swrve.push_receieved',
};

class SwrvePushManager  {

  private isInitialised: boolean;
  private webPushToken: string;
  private webPushApiKey: string;
  private config: SwrveConfig;
  private callBackPushRecieved: (event) => void;
  private callBackPushClicked: (event) => void;
  private callBackPushClosed: (event) => void;

  public constructor(swrveConfig: SwrveConfig, webPushApiKey: string, onPushReceived?: () => void, onPushClicked?: () => void, onPushClosed?: () => void) {
    this.config = swrveConfig;
    this.isInitialised = false;
    this.webPushApiKey = webPushApiKey;
    this.callBackPushRecieved = onPushReceived;
    this.callBackPushClicked = onPushClicked;
    this.callBackPushClosed = onPushClosed;
  }

  public get IsInitialised(): boolean {
    return this.isInitialised;
  }

  public get WebPushApiKey(): string {
    return this.webPushApiKey;
  }

  public init() {
    if (this.IsInitialised) {
      SwrveLogger.infoMsg('SwrvePushManager :: Already Initialised');
      return;
    }

    if (!this.isPushSupported()) {
      SwrveLogger.infoMsg('SwrvePushManager :: Push is not supported');
      return;
    }

    this.isInitialised = true;
  }

  public registerPush(onSuccess?: () => void, onFailure?: (err: Error) => void) {
    this.check();
    const successCallback = isNil(onSuccess) ? noOp : onSuccess;
    const failCallback = isNil(onFailure) ? noOp : onFailure;
    const serviceWorkerFile = this.config.ServiceWorker;

    navigator.serviceWorker.register(serviceWorkerFile).then((serviceWorkerRegistration) => {
      SwrveLogger.infoMsg(`Registering service worker: ${serviceWorkerFile}`);
      SwrveLogger.infoMsg(serviceWorkerRegistration);

      serviceWorkerRegistration.pushManager.getSubscription().then((existingSubscription) => {
        if (isNil(existingSubscription)) {
          SwrveLogger.infoMsg('Attempting to subscribe to push');
          const keyArray = base64UrlToUint8Array(this.WebPushApiKey);
          const options = {
            applicationServerKey: keyArray,
            userVisibleOnly: this.config.UserVisibleOnly,
          };

          serviceWorkerRegistration.pushManager.subscribe(options).then((newSubscription) => {
            this.sendPushRegistrationProperties(newSubscription);
            SwrveLogger.infoMsg('Subscribed Successfully');
            successCallback();
          })
          .catch((error) => {
            SwrveLogger.errorMsg('Subcription to push failed');
            SwrveLogger.errorMsg(error);
            failCallback(error);
          });
        } else {
          SwrveLogger.infoMsg('Already subscribed to push');
          this.sendPushRegistrationProperties(existingSubscription);
          successCallback();
          return;
        }
      })
      .catch((err) => {
        SwrveLogger.errorMsg('Cannot get Push Subscription Information');
        SwrveLogger.errorMsg(err);
        failCallback(err);
      });
    });
    this.registerPushListeners();
  }

  public unregisterPush(onSuccess: () => void, onFailure: (err: Error) => void) {
    this.check();
    const successCallback = isNil(onSuccess) ? noOp : onSuccess;
    const failCallback = isNil(onFailure) ? noOp : onFailure;
    const failure = (e: Error) => {
      SwrveLogger.errorMsg(e);
      failCallback(e);
    };
    navigator.serviceWorker.ready.then((serviceWorkerRegistration) => {
      serviceWorkerRegistration.pushManager.getSubscription().then((existingSubscription) => {
        if (isNil(existingSubscription)) {
          SwrveLogger.warnMsg('Could not unregister push. No subscription found');
          return;
        }

        existingSubscription.unsubscribe().then(() => {
          /** This part disables the service workers for this page, probably not necessary - UPDATE For whatever reason, if we don't do this the push goes stale and can't be resent.
           * We can't leave this in long term
           *  TODO: Investigate this
           */
          navigator.serviceWorker.getRegistrations().then((registrations) => {
            for (const registration of registrations) {
              SwrveLogger.infoMsg('Unregistering from Service Worker');
              SwrveLogger.infoMsg(registration);
              registration.unregister();
            }
          });
          successCallback();
        }).catch((e) => {
          SwrveLogger.errorMsg('Error unsubscribing from push');
          failure(e);
        });
      }).catch((e) => {
        SwrveLogger.errorMsg('Error fetching existing subscription');
        failure(e);
      });
    });
  }

  public isPushSupported() {
    return ('serviceWorker' in navigator && 'PushManager' in window);
  }

  public onPushReceived(event) {
    SwrveLogger.infoMsg('Notification Received');
    return isNil(this.callBackPushRecieved) ? null : this.callBackPushRecieved(event);
  }

  public onPushClicked(event) {
    SwrveLogger.infoMsg('Notification Clicked');
    SwrveLogger.infoMsg(event);

    if (isPresent(event.data) && isPresent(event.data.body.id)) {
      SwrveSDK.checkInstance().pushNotificationEngagedEvent(event.data.body.id, event.data.body.deeplink);
    }

    return isNil(this.callBackPushClicked) ? null : this.callBackPushClicked(event);
  }

  public onPushClosed(event) {
    SwrveLogger.infoMsg('Notification Closed');
    return isNil(this.callBackPushClosed) ? null : this.callBackPushClosed(event);
  }

  private registerPushListeners() {
    navigator.serviceWorker.removeEventListener('message', this.pushHandler); // Remove any existing push listeners to avoid duplicates
    navigator.serviceWorker.addEventListener('message', ((e) => {
      this.pushHandler(e);
    }).bind(this),                           false);
  }

  private pushHandler(event) {
    SwrveLogger.infoMsg('PushManager receieved message event');
    SwrveLogger.infoMsg(event);
    const { data } = event;
    if (isNil(data)) {
      SwrveLogger.errorMsg('Could not parse message from service worker');
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

  private check() {
    if (!this.IsInitialised) {
      throw new Error('SwrvePushManager Not Initialised!');
    }
  }

  private sendPushRegistrationProperties(pushSubscription: PushSubscription) {
    const subscription = pushSubscription.toJSON();
    const auth = subscription.keys.auth;
    const p256dh = subscription.keys.p256dh;
    const endpoint = subscription.endpoint;
    this.webPushToken = `${endpoint}|${p256dh}|${auth}`;
    SwrveLogger.infoMsg(`sending push registration properties : ${this.webPushToken}`);
    SwrveLogger.infoMsg(subscription);
    SwrveSDK.userUpdate({ 'swrve.web_push_token': this.webPushToken });
    this.sendBrowserPermissions(pushSubscription);
  }

  private async sendBrowserPermissions(pushSubscription: PushSubscription) {
    if (this.browserHasPermissionsAccess()) {
      // tslint:disable-next-line:no-string-literal // There is no navigator.permissions in typescript yet. Specifically lib.dom.ts due to it being in draft status
      await navigator['permissions'].query({ name: 'notifications' }).then((permissionStatus) => {
        SwrveLogger.infoMsg(`notifications permission status is  ${permissionStatus.state}`);
        this.sendPermissionsUpdate(permissionStatus.state);
        permissionStatus.onchange = (e) => {
          SwrveLogger.infoMsg(`notifications permission status has changed to ${e.target.state}`);
          this.sendPermissionsUpdate(e.target.state);
        };
      });
    } else {
      SwrveLogger.warnMsg('notifications permission status is unknown');
      this.sendPermissionsUpdate('unknown');
    }
  }

  private sendPermissionsUpdate(state: string) {
    SwrveSDK.userUpdate({ 'swrve.permission.web.push_notifications': state });
  }

  private browserHasPermissionsAccess(): boolean {
    // tslint:disable-next-line:no-string-literal // There is no navigator.permissions in typescript yet. Specifically lib.dom.ts due to it being in draft status
    return (navigator['permissions'] !== undefined);
  }
}

export default SwrvePushManager;
