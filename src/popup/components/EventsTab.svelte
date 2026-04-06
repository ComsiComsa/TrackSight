<script lang="ts">
  import type { ParsedEvent } from "../../types";
  import TrackerFilter from "./TrackerFilter.svelte";
  import GroupedEventList from "./GroupedEventList.svelte";
  import EventDetail from "./EventDetail.svelte";

  interface Props {
    events: ParsedEvent[];
    paused: boolean;
    t: (key: string) => string;
    onTogglePause: () => void;
    onClear: () => void;
    headerMode: boolean;
  }

  let { events, paused, t, onTogglePause, onClear, headerMode }: Props = $props();

  let searchQuery = $state("");
  let activeTrackers = $state<Set<string>>(new Set());
  let selectedEvent = $state<ParsedEvent | null>(null);
  let exportOpen = $state(false);

  let filteredEvents = $derived.by(() => {
    let result = events;
    if (activeTrackers.size > 0) {
      result = result.filter((e) => activeTrackers.has(e.trackerName));
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

  function handleExport(format: "json" | "csv") {
    exportOpen = false;
    const data = filteredEvents;
    const ts = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
    let content: string;
    let filename: string;

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

{#if headerMode}
  <!-- Inline header controls (rendered inside the header bar) -->
  <div class="flex items-center gap-1">
    <span class="text-indigo-200 text-xs tabular-nums mr-1">{filteredEvents.length} {t("events.count")}</span>

    <button
      onclick={onTogglePause}
      class="p-1 rounded transition-colors hover:bg-indigo-500/50"
      title={paused ? t("events.paused") : t("events.recording")}
    >
      {#if paused}
        <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor"><path d="M4 2l10 6-10 6V2z"/></svg>
      {:else}
        <span class="inline-block w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse"></span>
      {/if}
    </button>

    <button onclick={onClear} class="p-1 rounded transition-colors hover:bg-indigo-500/50" title={t("events.clear")}>
      <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 4h12M5.5 4V2.5h5V4M6 7v5M10 7v5M3.5 4l.5 9.5h8l.5-9.5"/></svg>
    </button>

    <div class="relative">
      <button onclick={() => (exportOpen = !exportOpen)} class="p-1 rounded transition-colors hover:bg-indigo-500/50" title={t("events.export")}>
        <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 2v9M4.5 7.5L8 11l3.5-3.5M2 13h12"/></svg>
      </button>
      {#if exportOpen}
        <div class="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-30 min-w-[90px] py-1">
          <button onclick={() => handleExport("json")} class="block w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100">JSON</button>
          <button onclick={() => handleExport("csv")} class="block w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100">CSV</button>
        </div>
      {/if}
    </div>
  </div>
{:else}
  <!-- Content area -->
  <!-- Search -->
  <div class="flex items-center gap-1 px-2 py-1.5 border-b border-gray-200 shrink-0">
    <input
      type="text"
      placeholder={t("events.search")}
      bind:value={searchQuery}
      class="flex-1 px-2 py-1 text-xs rounded border border-gray-200 bg-gray-50 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 focus:bg-white min-w-0"
    />
  </div>

  <!-- Tracker filter -->
  <TrackerFilter {events} bind:activeTrackers />

  <!-- Content -->
  {#if selectedEvent}
    <EventDetail
      event={selectedEvent}
      {t}
      onBack={() => (selectedEvent = null)}
    />
  {:else}
    <GroupedEventList
      events={filteredEvents}
      {t}
      onSelect={(e) => (selectedEvent = e)}
    />
  {/if}
{/if}
