import type { ParsedEvent } from "../types";

const MAX_EVENTS_PER_TAB = 5000;
const MAX_TABS = 100;

/** In-memory per-tab event store */
const tabEvents = new Map<number, ParsedEvent[]>();

export function addEvent(tabId: number, event: ParsedEvent): void {
  let events = tabEvents.get(tabId);
  if (!events) {
    if (tabEvents.size >= MAX_TABS) {
      // Delete the oldest tab entry
      const oldestKey = tabEvents.keys().next().value;
      if (oldestKey !== undefined) tabEvents.delete(oldestKey);
    }
    events = [];
    tabEvents.set(tabId, events);
  }
  events.push(event);
  if (events.length > MAX_EVENTS_PER_TAB) {
    events.splice(0, events.length - MAX_EVENTS_PER_TAB);
  }
}

export function getEvents(tabId: number): ParsedEvent[] {
  return tabEvents.get(tabId) ?? [];
}

export function clearEvents(tabId: number): void {
  tabEvents.delete(tabId);
}

export function removeTab(tabId: number): void {
  tabEvents.delete(tabId);
}
