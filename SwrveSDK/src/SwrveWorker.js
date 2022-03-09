const eventTypes = {
  swrvePushNotificationClicked: "swrve.push_clicked",
  swrvePushNotificationClosed: "swrve.push_closed",
  swrvePushReceived: "swrve.push_received",
};

function sendClientMessage(event, type, body) {
  var msg_chan = new MessageChannel();
  msg_chan.port1.onmessage = function (event) {
    if (event.data.error) {
      reject(event.data.error);
    } else {
      resolve(event.data);
    }
  };

  clients.matchAll({ includeUncontrolled: true }).then((clients) => {
    clients.forEach((client) => {
      client.postMessage(
        {
          event: JSON.stringify(event),
          type,
          body,
        },
        [msg_chan.port2]
      );
    });
  });
}

self.addEventListener("push", (event) => {
  var pushData;
  if (event.data) {
    pushData = event.data.json();

    if (pushData.data.swrve && pushData.data.swrve._p) {
      const builtNotification = {
        body: pushData.body,
        data: {
          swrve: {
            title: pushData.data.swrve.title,
            p: pushData.data.swrve._p,
            sd: pushData.data.swrve._sd,
          },
        },
      };

      if (pushData.image) {
        builtNotification.image = pushData.image;
      }

      if (pushData.icon) {
        builtNotification.icon = pushData.icon;
      }

      if (pushData.payload) {
        builtNotification.data.payload = pushData.payload;
      }

      event.waitUntil(
        Promise.all([
          /** NB The title is a separate entry to the rest of the push, probably the case in the payload too */
          new Promise(() => {
            sendClientMessage(event, eventTypes.swrvePushReceived, {
              id: pushData.data.swrve._p,
            });
          }),
          self.registration.showNotification(
            builtNotification.data.swrve.title,
            builtNotification
          ),
        ])
      );
    }
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  let clickResponsePromise = Promise.resolve();

  var bodyPayload = {
    id: event.notification.data.swrve.p,
    customPayload: event.notification.data.payload,
  };

  if (event.notification.data.swrve.sd) {
    bodyPayload.deeplink = event.notification.data.swrve.sd;
    clickResponsePromise = clients.openWindow(bodyPayload.deeplink);
  }

  event.waitUntil(
    Promise.all([
      clickResponsePromise,
      new Promise(() => {
        sendClientMessage(
          event,
          eventTypes.swrvePushNotificationClicked,
          bodyPayload
        );
      }),
    ])
  );
});

self.addEventListener("notificationclose", (event) => {
  event.waitUntil(
    Promise.all([
      new Promise(() => {
        sendClientMessage(event, eventTypes.swrvePushNotificationClosed, {});
      }),
    ])
  );
});

self.addEventListener("install", function (event) {
  /** ensures when registering, the newest iteration of the service worker is in use */
  self.skipWaiting();
});
