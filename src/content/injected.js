/**
 * TrackSight — Injected page script
 * Runs in the page's JS context. Monkey-patches fetch, XHR, sendBeacon,
 * and Image to intercept analytics requests.
 *
 * SAFETY: All wrappers use try/finally to guarantee original functions
 * are always called, even if our interception code throws.
 */

var TS_SOURCE = "tracksight-injected";

function sendIntercepted(data) {
  try {
    window.postMessage(
      {
        source: TS_SOURCE,
        type: "INTERCEPTED_REQUEST",
        payload: {
          url: data.url,
          method: data.method,
          body: data.body || null,
          timestamp: Date.now(),
          source: data.source,
        },
      },
      "*"
    );
  } catch {}
}

// --- Monkey-patch fetch ---

var originalFetch = window.fetch;

window.fetch = function (input, init) {
  try {
    var requestUrl = typeof input === "string" ? input : input instanceof Request ? input.url : String(input);
    requestUrl = new URL(requestUrl, window.location.origin).href;
    var method = ((init && init.method) || (input instanceof Request && input.method) || "GET").toUpperCase();
    var body = null;
    if (init && init.body) {
      try { body = typeof init.body === "string" ? init.body : null; } catch {}
    }
    sendIntercepted({ url: requestUrl, method: method, body: body, source: "fetch" });
  } catch {}
  return originalFetch.call(window, input, init);
};

// --- Monkey-patch XMLHttpRequest ---

var originalOpen = XMLHttpRequest.prototype.open;
var originalSend = XMLHttpRequest.prototype.send;

XMLHttpRequest.prototype.open = function (method, url) {
  try {
    this._ts_method = (method || "GET").toUpperCase();
    this._ts_url = new URL(String(url), window.location.origin).href;
  } catch {
    this._ts_url = String(url);
  }
  return originalOpen.apply(this, arguments);
};

XMLHttpRequest.prototype.send = function (body) {
  try {
    if (this._ts_url) {
      var bodyStr = null;
      if (body) {
        try { bodyStr = typeof body === "string" ? body : null; } catch {}
      }
      sendIntercepted({ url: this._ts_url, method: this._ts_method, body: bodyStr, source: "xhr" });
    }
  } catch {}
  return originalSend.apply(this, arguments);
};

// --- Monkey-patch navigator.sendBeacon ---

if (navigator.sendBeacon) {
  var originalBeacon = navigator.sendBeacon.bind(navigator);

  navigator.sendBeacon = function (url, data) {
    try {
      var fullUrl = new URL(String(url), window.location.origin).href;
      var body = null;
      if (data) {
        if (typeof data === "string") {
          body = data;
        } else if (data instanceof URLSearchParams) {
          body = data.toString();
        }
      }
      sendIntercepted({ url: fullUrl, method: "POST", body: body, source: "beacon" });
    } catch {}
    return originalBeacon(url, data);
  };
}

// --- Monkey-patch Image (pixel tracking) ---
// Only intercept images to known tracking domains to avoid noise from regular images.

var TRACKING_DOMAINS = [
  "google-analytics.com", "analytics.google.com", "googletagmanager.com",
  "facebook.com/tr", "facebook.net/tr",
  "ct.pinterest.com", "px.ads.linkedin.com", "snap.licdn.com",
  "tr.snapchat.com", "analytics.tiktok.com",
  "mc.yandex.ru", "mc.yandex.com",
];

var originalDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "src");

if (originalDescriptor && originalDescriptor.set) {
  Object.defineProperty(HTMLImageElement.prototype, "src", {
    set: function (value) {
      try {
        var fullUrl = new URL(String(value), window.location.origin).href;
        var isTracking = TRACKING_DOMAINS.some(function (d) { return fullUrl.includes(d); });
        if (isTracking) {
          sendIntercepted({ url: fullUrl, method: "GET", body: null, source: "pixel" });
        }
      } catch {}
      originalDescriptor.set.call(this, value);
    },
    get: originalDescriptor.get,
    configurable: true,
  });
}

console.log("[TrackSight] Injected script loaded — monitoring fetch/XHR/beacon/pixel");
