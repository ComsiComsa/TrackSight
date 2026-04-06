import { MSG } from "../types";
import type { Message, InterceptedRequest, ParsedEvent } from "../types";
import { parseRequest } from "../parsers/registry";
import { addEvent, getEvents, clearEvents, removeTab } from "./event-store";

// Track connected devtools panels: tabId -> port
const devtoolsPorts = new Map<number, chrome.runtime.Port>();

// Handle long-lived connections from DevTools panels
chrome.runtime.onConnect.addListener((port) => {
  if (!port.name.startsWith("devtools-")) return;

  const tabId = parseInt(port.name.replace("devtools-", ""), 10);
  if (isNaN(tabId)) return;

  devtoolsPorts.set(tabId, port);

  port.onMessage.addListener((message) => {
    if (message.type === MSG.GET_EVENTS) {
      const events = getEvents(tabId);
      if (events.length > 0) {
        port.postMessage({ type: MSG.EVENTS_BATCH, payload: events });
      }
    } else if (message.type === MSG.CLEAR_EVENTS) {
      clearEvents(tabId);
    }
  });

  port.onDisconnect.addListener(() => {
    devtoolsPorts.delete(tabId);
  });
});

// Handle intercepted requests from content scripts
chrome.runtime.onMessage.addListener((message: Message, sender) => {
  if (message.type !== MSG.INTERCEPTED_REQUEST) return;

  const tabId = sender.tab?.id;
  if (!tabId) return;

  const request = message.payload as InterceptedRequest;
  const parsed = parseRequest(request);
  if (!parsed) return;

  addEvent(tabId, parsed);

  // Forward to DevTools panel if connected
  const port = devtoolsPorts.get(tabId);
  if (port) {
    try {
      port.postMessage({ type: MSG.PARSED_EVENT, payload: parsed });
    } catch {
      devtoolsPorts.delete(tabId);
    }
  }

  // Update badge
  updateBadge(tabId);
});

// Clean up when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  removeTab(tabId);
  devtoolsPorts.delete(tabId);
});

async function updateBadge(tabId: number): Promise<void> {
  const events = getEvents(tabId);
  const count = events.length;
  const text = count > 0 ? (count > 999 ? "999+" : String(count)) : "";
  chrome.action.setBadgeText({ text, tabId });
  if (count > 0) {
    chrome.action.setBadgeBackgroundColor({ color: "#007acc", tabId });
  }
}

console.log("[TrackSight] Background service worker loaded");
