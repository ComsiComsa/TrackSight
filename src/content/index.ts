const TS_SOURCE = "tracksight-injected";

function injectPageScript() {
  try {
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("src/content/injected.js");
    document.documentElement.appendChild(script);
    script.onload = () => script.remove();
  } catch {
    // Extension context invalidated (extension was reloaded)
  }
}

// Bridge: page context -> background service worker
window.addEventListener("message", (event) => {
  if (event.origin !== window.location.origin) return;
  if (event.source !== window || event.data?.source !== TS_SOURCE) return;

  if (event.data.type === "INTERCEPTED_REQUEST") {
    try {
      chrome.runtime.sendMessage({
        type: event.data.type,
        payload: event.data.payload,
      });
    } catch {
      // Extension context invalidated — silently ignore
    }
  }
});

injectPageScript();
