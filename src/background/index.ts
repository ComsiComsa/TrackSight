import { MSG } from "../types";
import type { Message, InterceptedRequest, Settings } from "../types";
import { DEFAULT_SETTINGS } from "../types";
import { parseRequest } from "../parsers/registry";
import { setCustomTrackers, setKeywordRules } from "../parsers/custom";
import { addEvent, getEvents, clearEvents, removeTab } from "./event-store";

// Track connected UI ports (popup or devtools): tabId -> port[]
const uiPorts = new Map<number, chrome.runtime.Port[]>();

// Recording state — off by default
let recording = false;

// Load custom trackers and keyword rules from settings
async function loadSettings() {
  const result = await chrome.storage.local.get(["settings", "recording"]);
  const settings: Settings = result.settings ?? DEFAULT_SETTINGS;
  setCustomTrackers(settings.customTrackers ?? []);
  setKeywordRules(settings.keywordRules ?? []);
  recording = result.recording === true;
}

loadSettings();

// Reload when settings/recording change
chrome.storage.onChanged.addListener((changes) => {
  if (changes.settings) {
    loadSettings();
  }
  if (changes.recording) {
    recording = changes.recording.newValue === true;
  }
});

// Handle long-lived connections from popup or devtools panels
chrome.runtime.onConnect.addListener((port) => {
  const match = port.name.match(/^(?:popup|devtools)-(\d+)$/);
  if (!match) return;

  const tabId = parseInt(match[1], 10);
  if (isNaN(tabId)) return;

  // Store multiple ports per tab (popup + devtools can be open simultaneously)
  const ports = uiPorts.get(tabId) ?? [];
  ports.push(port);
  uiPorts.set(tabId, ports);

  port.onMessage.addListener((message) => {
    if (message.type === MSG.GET_EVENTS) {
      const events = getEvents(tabId);
      if (events.length > 0) {
        port.postMessage({ type: MSG.EVENTS_BATCH, payload: events });
      }
    } else if (message.type === MSG.CLEAR_EVENTS) {
      clearEvents(tabId);
      updateBadge(tabId);
    }
  });

  port.onDisconnect.addListener(() => {
    const remaining = (uiPorts.get(tabId) ?? []).filter((p) => p !== port);
    if (remaining.length > 0) {
      uiPorts.set(tabId, remaining);
    } else {
      uiPorts.delete(tabId);
    }
  });
});

// Handle intercepted requests from content scripts
chrome.runtime.onMessage.addListener((message: Message, sender) => {
  if (message.type !== MSG.INTERCEPTED_REQUEST) return;
  if (!recording) return;

  const tabId = sender.tab?.id;
  if (!tabId) return;

  const request = message.payload as InterceptedRequest;
  if (typeof request?.url !== 'string' || typeof request?.method !== 'string' || typeof request?.timestamp !== 'number') return;
  const parsed = parseRequest(request);
  if (!parsed) return;

  addEvent(tabId, parsed);

  // Forward to all connected UIs for this tab
  const ports = uiPorts.get(tabId) ?? [];
  for (const port of ports) {
    try {
      port.postMessage({ type: MSG.PARSED_EVENT, payload: parsed });
    } catch {
      // Port disconnected, will be cleaned up by onDisconnect
    }
  }

  updateBadge(tabId);
});

// Clean up when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  removeTab(tabId);
  uiPorts.delete(tabId);
});

async function updateBadge(tabId: number): Promise<void> {
  const events = getEvents(tabId);
  const count = events.length;
  const text = count > 0 ? (count > 999 ? "999+" : String(count)) : "";
  chrome.action.setBadgeText({ text, tabId });
  if (count > 0) {
    chrome.action.setBadgeBackgroundColor({ color: "#4F46E5", tabId });
  }
}

console.log("[TrackSight] Background service worker loaded");
