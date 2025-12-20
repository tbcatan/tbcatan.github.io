const messageServer = "https://messages-lwz6.onrender.com";

const messageStream = (() => {
  const listeners = new Set();
  const addListener = (listener) => listeners.add(listener);
  const removeListener = (listener) => listeners.remove(listener);

  let eventSource;
  const reload = () => {
    eventSource?.close();
    eventSource = new EventSource(`${messageServer}/messages`);
    eventSource.addEventListener("message", (event) =>
      listeners.forEach((listener) => {
        try {
          listener(event);
        } catch (e) {
          console.error(e);
        }
      })
    );
  };
  const close = () => eventSource?.close();

  reload();
  return { addListener, removeListener, reload, close };
})();

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    messageStream.reload();
  }
});

const getMessageSnapshots = () =>
  fetch(`${messageServer}/messages/snapshot`).then((response) => {
    if (response.ok) {
      return response.json();
    } else {
      return Promise.reject(response);
    }
  });

const sendMessages = (messages) =>
  fetch(`${messageServer}/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(messages),
  }).then((response) => {
    if (response.ok) {
      return response;
    } else {
      return Promise.reject(response);
    }
  });

const { message, initMessages, publishMessages } = (() => {
  const messageStates = new Map();
  const messageVersions = new Map();
  const messageListeners = new Map();

  const updateMessage = (key, version, data) => {
    const currentVersion = messageVersions.get(key) ?? 0;
    if (version > currentVersion) {
      messageStates.set(key, data);
      messageVersions.set(key, version);
      messageListeners.get(key)?.forEach((listener) => listener());
    }
  };

  messageStream.addListener((event) => {
    const id = JSON.parse(event.lastEventId);
    const data = JSON.parse(event.data);
    updateMessage(id.key, id.version, data);
  });

  const initSnapshots = retry(() =>
    getMessageSnapshots().then((snapshots) =>
      snapshots?.forEach((snapshot) => updateMessage(snapshot.id.key, snapshot.id.version, snapshot.data))
    )
  );

  const publishMessages = async (messages, synchronize) => {
    const newMessages = messages.map((message) => ({
      key: message.key,
      version: (message.version ?? messageVersions.get(message.key) ?? 0) + 1,
      data: message.data,
    }));
    const response = await sendMessages({
      messages: newMessages,
      synchronize: synchronize?.map((synchronize) => ({
        key: synchronize.key,
        version: synchronize.version ?? messageVersions.get(synchronize.key) ?? 0,
      })),
    });
    newMessages.forEach((message) => updateMessage(message.key, message.version, message.data));
    return response;
  };

  return {
    message: (key) => {
      const state = () => messageStates.get(key) ?? null;
      const version = () => messageVersions.get(key) ?? 0;

      const subscribe = (subscriber) => {
        const listener = () => {
          queueMicrotask(() => subscriber(state(), version()));
        };

        if (!messageListeners.has(key)) {
          messageListeners.set(key, new Set());
        }
        messageListeners.get(key).add(listener);
        listener();

        return {
          unsubscribe: () => {
            subscriber = () => {};
            messageListeners.get(key).delete(listener);
          },
        };
      };

      const publish = (data, version, synchronize) => publishMessages([{ key, version, data }], synchronize);

      return { key, state, version, subscribe, publish };
    },
    initMessages: async () => {
      await initSnapshots;
    },
    publishMessages,
  };
})();
