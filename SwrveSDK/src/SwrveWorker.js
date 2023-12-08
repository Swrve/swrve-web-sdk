const EVENT_TYPES = {
  swrvePushNotificationClicked: "swrve.push_clicked",
  swrvePushNotificationClosed: "swrve.push_closed",
  swrvePushReceived: "swrve.push_received",
};
const DB_NAME = 'swrve_push_events_db';
const PUSH_DATA_STORE_NAME = 'swrve_push_events';
const USERS_STORE_NAME = 'swrve_users'
const NOTIFICATION_PROPERTIES = ['body', 'image', 'icon', 'payload'];

function initDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = event => {
      const db = event.target.result;

      // Create the current_users store with an index for last active
      const usersStore = db.createObjectStore(USERS_STORE_NAME, { keyPath: 'user_id', autoIncrement: false });
      usersStore.createIndex('last_active', 'last_active', { unique: false });

      // Create the push_data store with an index on user_id
      const pushDataStore = db.createObjectStore(PUSH_DATA_STORE_NAME, { keyPath: 'id', autoIncrement: true });
      pushDataStore.createIndex('user_id', 'user_id', { unique: false });
    };

    request.onsuccess = event => {
      resolve(event.target.result);
    };

    request.onerror = event => {
      reject(new Error(`Failed to open database: ${event.target.error}`));
    };
  });
}

async function getCurrentUser() {
  try {
    const db = await initDatabase();
    const transaction = db.transaction(USERS_STORE_NAME, 'readonly');
    const store = transaction.objectStore(USERS_STORE_NAME);
    const index = store.index('last_active');

    const getRequest = index.openCursor(null, 'prev');

    let currentUser = null;

    getRequest.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        currentUser = cursor.value;
        db.close();
      } else {
        throw new Error('No user found');
      }
    };

    return new Promise((resolve, reject) => {
      getRequest.onerror = (event) => {
        db.close();
        reject(new Error(`Failed to retrieve current user: ${event.target.error}`));
      };

      transaction.oncomplete = () => resolve(currentUser);
    });
  } catch (error) {
    throw new Error(`Error initializing database: ${error.message}`);
  }
}

async function storePushEventData(pushEvent) {
  try {
    const db = await initDatabase();
    const transaction = db.transaction(PUSH_DATA_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(PUSH_DATA_STORE_NAME);

    const pushEventObject = { ...pushEvent, timestamp: Date.now() };

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };

      transaction.onerror = (event) => {
        db.close();
        reject(new Error(`Failed to store push data: ${event.target.error}`));
      };

      store.add(pushEventObject);
    });
  } catch (error) {
    throw new Error(`Error initializing database: ${error.message}`);
  }
}

async function getPushDataByUserId(userId) {
  try {
    const db = await initDatabase();
    const transaction = db.transaction(PUSH_DATA_STORE_NAME, 'readonly');
    const store = transaction.objectStore(PUSH_DATA_STORE_NAME);
    const index = store.index('user_id');

    const getRequest = index.getAll(userId);

    return new Promise((resolve, reject) => {
      getRequest.onsuccess = (event) => {
        db.close();
        const result = event.target.result;

        // Sort the result array by timestamp in asc order
        const sorted = result.sort((a, b) => a.timestamp - b.timestamp);
        resolve(sorted);
      };

      getRequest.onerror = (event) => {
        db.close();
        reject(new Error(`Failed to retrieve push data: ${event.target.error}`));
      };
    });
  } catch (error) {
    throw new Error(`Error initializing database: ${error.message}`);
  }
}

async function setCurrentUser(user) {
  try {
    const db = await initDatabase();
    const transaction = db.transaction(USERS_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(USERS_STORE_NAME);

    // Check if the user_id already exists in the store
    let record = await getUserRecord(store, user.user_id);
    const now = Date.now();
    if (record) {
      record.last_active = now;
      store.put(record);
    } else {
      record = {...user, last_active: now}
      store.add(record);
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        db.close();
        resolve(record);
      };

      transaction.onerror = (event) => {
        db.close();
        reject(new Error(`Failed to store current user: ${event.target.error}`));
      };
    });
  } catch (error) {
    throw new Error(`Error initializing database: ${error.message}`);
  }
}

async function getUserRecord(store, userId) {
  return new Promise((resolve, reject) => {
    const getRequest = store.get(userId);

    getRequest.onsuccess = (event) => {
      resolve(event.target.result);
    };

    getRequest.onerror = () => {
      reject(new Error('Failed to get user record'));
    };
  });
}

async function deletePushDataByUserId(userId) {
  try {
    const db = await initDatabase();
    const transaction = db.transaction(PUSH_DATA_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(PUSH_DATA_STORE_NAME);
    const index = store.index('user_id');

    const getRequest = index.getAll(userId);

    getRequest.onsuccess = (event) => {
      const pushData = event.target.result;
      pushData.forEach((data) => { store.delete(data.id); });
      db.close();
    };
  } catch (error) {
    throw new Error(`Error initializing database: ${error.message}`);
  }
}

function buildNotification(pushData) {
  const notification = {
    data: {
      swrve: {
        title: pushData.data.swrve.title,
        p: pushData.data.swrve._p,
        sd: pushData.data.swrve._sd,
      },
    },
  };

  NOTIFICATION_PROPERTIES.forEach(prop => {
    if (pushData[prop]) {
      const target = prop === 'payload' ? notification.data : notification;
      target[prop] = pushData[prop];
    }
  });

  return notification;
}

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
  if (!event.data) { return; } // No data, nothing to process

  const pushData = event.data.json();

  if (!pushData.data.swrve || !pushData.data.swrve._p) { return; } // Invalid or missing Swrve data

  const notification = buildNotification(pushData);
  event.waitUntil(
    (async () => {
      try {
        const currentUser = await getCurrentUser();
        await storePushEventData({
          event_type: EVENT_TYPES.swrvePushReceived,
          event: `Swrve.Messages.Push-${pushData.data.swrve._p}.delivered`,
          timestamp: Date.now(),
          user_id: currentUser.user_id
        });
      } catch (error) {
        console.error('Error storing push event data', error);
      }

      // always follow through with the action regardless of errors above
      await Promise.all([
        new Promise(() => {
          sendClientMessage(event, EVENT_TYPES.swrvePushReceived, {
            id: pushData.data.swrve._p,
          });
        }),
        self.registration.showNotification(
          notification.data.swrve.title,
          notification
        )
      ]);
    })()
  );
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
    (async () => {
      try {
        const currentUser = await getCurrentUser();
        await storePushEventData({
          event_type: EVENT_TYPES.swrvePushNotificationClicked,
          event: `Swrve.Messages.Push-${bodyPayload.id}.engaged`,
          timestamp: Date.now(),
          user_id: currentUser.user_id
        });
      } catch (error) {
        console.error('Error storing push event data:', error);
      }

      // always follow through with the action regardless of errors above
      await Promise.all([
        clickResponsePromise,
        new Promise(() => {
          sendClientMessage(
            event,
            EVENT_TYPES.swrvePushNotificationClicked,
            bodyPayload
          );
        })
      ]);
    })()
  );
});

self.addEventListener("notificationclose", (event) => {
  event.waitUntil(
    Promise.all([
      new Promise(() => {
        sendClientMessage(event, EVENT_TYPES.swrvePushNotificationClosed, {});
      }),
    ])
  );
});

self.addEventListener("install", function (event) {
  /** ensures when registering, the newest iteration of the service worker is in use */
  self.skipWaiting();
});

self.addEventListener('message', async (event) => {
  try {
    if (event.data) {
      switch (event.data.type) {
        case 'setUserSession':
          const user = await setCurrentUser({ user_id: event.data.user_id });
          event.ports[0].postMessage({ type: 'userSession', data: user });
          break;

        case 'fetchPushData':
          const pushData = await getPushDataByUserId(event.data.user_id);
          event.ports[0].postMessage({ type: 'pushData', data: pushData });

          if (pushData.length > 0) {
            await deletePushDataByUserId(event.data.user_id);
          }
          break;

        default:
          throw new Error("Unregistered message event: \n", event);
      }
    }
  } catch (error) {
    console.error(error);
  }
});
