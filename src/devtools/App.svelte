<script lang="ts">
  import type { ParsedEvent } from "../types";
  import { MSG } from "../types";
  import Toolbar from "./components/Toolbar.svelte";
  import TrackerFilter from "./components/TrackerFilter.svelte";
  import EventTable from "./components/EventTable.svelte";
  import EventDetail from "./components/EventDetail.svelte";

  let events = $state<ParsedEvent[]>([]);
  let paused = $state(false);
  let searchQuery = $state("");
  let activeTrackers = $state<Set<string>>(new Set());
  let selectedEvent = $state<ParsedEvent | null>(null);

  const tabId = chrome.devtools.inspectedWindow.tabId;

  // Connect to the service worker via long-lived port
  const port = chrome.runtime.connect({ name: `devtools-${tabId}` });

  port.onMessage.addListener((message) => {
    if (message.type === MSG.PARSED_EVENT && !paused) {
      events = [...events, message.payload];
    } else if (message.type === MSG.EVENTS_BATCH) {
      events = [...events, ...message.payload];
    }
  });

  // Request existing events for this tab
  port.postMessage({ type: MSG.GET_EVENTS, payload: { tabId } });

  let filteredEvents = $derived.by(() => {
    let result = events;

    if (activeTrackers.size > 0) {
      result = result.filter((e) => activeTrackers.has(e.tracker));
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.eventName.toLowerCase().includes(q) ||
          e.trackerName.toLowerCase().includes(q) ||
          e.rawUrl.toLowerCase().includes(q) ||
          JSON.stringify(e.parameters).toLowerCase().includes(q)
      );
    }

    return result;
  });

  function handleClear() {
    events = [];
    selectedEvent = null;
    port.postMessage({ type: MSG.CLEAR_EVENTS, payload: { tabId } });
  }

  function handleExport(format: "json" | "csv") {
    const data = filteredEvents;
    let content: string;
    let filename: string;
    const ts = new Date().toISOString().slice(0, 19).replace(/:/g, "-");

    if (format === "json") {
      content = JSON.stringify(data, null, 2);
      filename = `tracksight-${ts}.json`;
    } else {
      const headers = ["timestamp", "tracker", "eventName", "eventType", "rawUrl"];
      const rows = data.map((e) =>
        headers.map((h) => JSON.stringify(String((e as Record<string, unknown>)[h] ?? ""))).join(",")
      );
      content = [headers.join(","), ...rows].join("\n");
      filename = `tracksight-${ts}.csv`;
    }

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<div class="flex flex-col h-screen">
  <Toolbar
    bind:searchQuery
    {paused}
    eventCount={filteredEvents.length}
    onTogglePause={() => (paused = !paused)}
    onClear={handleClear}
    onExport={handleExport}
  />

  <TrackerFilter {events} bind:activeTrackers />

  <div class="flex flex-1 min-h-0">
    <EventTable
      events={filteredEvents}
      {selectedEvent}
      onSelect={(e) => (selectedEvent = e)}
    />

    {#if selectedEvent}
      <EventDetail
        event={selectedEvent}
        onClose={() => (selectedEvent = null)}
      />
    {/if}
  </div>
</div>
