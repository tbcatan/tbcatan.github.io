const sleep = (durationMs) => new Promise((resolve) => setTimeout(resolve, durationMs));

const retry = (request, options) => {
  let { condition, wait, maxRetries } = options ?? {};

  condition = condition ?? (() => true);
  wait = wait ?? ((attempt) => 1000 * 1.5 ** attempt);
  maxRetries = maxRetries ?? 15;

  let attempt = 0;
  const retryRequest = () =>
    request().catch((e) => {
      if (attempt < maxRetries && condition(e)) {
        console.error(e);
        return sleep(wait(attempt++)).then(retryRequest);
      } else {
        return Promise.reject(e);
      }
    });
  return retryRequest();
};

const base64UrlSafeEncode = (uint8Array) => {
  const string = String.fromCharCode(...uint8Array);
  const base64 = btoa(string);
  const base64UrlSafe = base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  return base64UrlSafe;
};

const isBase64UrlSafe = (string) => /^[a-zA-Z0-9_\-]+$/.test(string);

const element = (id) => document.getElementById(id);

const template = (id) => {
  const instance = element("templates").content.getElementById(id)?.cloneNode(true);
  instance.removeAttribute("id");
  return instance;
};

const createElement = (tag, options) => {
  const newElement = document.createElement(tag);
  if (options?.attributes) {
    Object.entries(options.attributes).forEach(([key, value]) => newElement.setAttribute(key, value));
  }
  if (options?.id) {
    newElement.setAttribute("id", options.id);
  }
  if (options?.class) {
    newElement.setAttribute("class", options.class);
  }
  if (options?.children) {
    newElement.append(...options.children);
  }
  if (options?.init) {
    options.init(newElement);
  }
  return newElement;
};

const classes = (...classes) => classes.filter((s) => s).join(" ");

const addLongPressListener = (targetElement, eventHandler) => {
  targetElement.addEventListener("dblclick", eventHandler);
  let touchTimeout;
  targetElement.addEventListener("touchstart", (event) => {
    event.preventDefault();
    clearTimeout(touchTimeout);
    touchTimeout = setTimeout(eventHandler, 500);
  });
  targetElement.addEventListener("touchend", () => {
    clearTimeout(touchTimeout);
    touchTimeout = undefined;
  });
};
