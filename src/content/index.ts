const TS_SOURCE = "tracksight-injected";

// Inject the page-level script
function injectPageScript() {
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("src/content/injected.js");
  script.type = "module";
  document.documentElement.appendChild(script);
  script.onload = () => script.remove();
}

// Bridge: page context -> background service worker
window.addEventListener("message", (event) => {
  if (event.source !== window || event.data?.source !== TS_SOURCE) return;

  if (event.data.type === "INTERCEPTED_REQUEST") {
    chrome.runtime.sendMessage({
      type: event.data.type,
      payload: event.data.payload,
    });
  }
});

injectPageScript();
