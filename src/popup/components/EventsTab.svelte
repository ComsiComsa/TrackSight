<script lang="ts">
  import type { ParsedEvent } from "../../types";
  import TrackerFilter from "./TrackerFilter.svelte";
  import GroupedEventList from "./GroupedEventList.svelte";
  import EventDetail from "./EventDetail.svelte";

  interface Props {
    events: ParsedEvent[];
    t: (key: string) => string;
    initialTrackerFilter?: string | null;
  }

  let { events, t, initialTrackerFilter = null }: Props = $props();

  let searchQuery = $state("");
  let activeTrackers = $state<Set<string>>(new Set());
  let selectedEvent = $state<ParsedEvent | null>(null);

  $effect(() => {
    if (initialTrackerFilter) {
      activeTrackers = new Set([initialTrackerFilter]);
    }
  });

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
</script>

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
