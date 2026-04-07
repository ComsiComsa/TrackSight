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
  let activeEventTypes = $state<Set<string>>(new Set());
  let selectedEvent = $state<ParsedEvent | null>(null);
  let eventTypeFilterOpen = $state(true);

  $effect(() => {
    if (initialTrackerFilter) {
      activeTrackers = new Set([initialTrackerFilter]);
    }
  });

  // Events after tracker + search filter (before event type filter)
  let trackerFilteredEvents = $derived.by(() => {
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

  // Unique event types with counts from tracker-filtered events
  let eventTypeCounts = $derived.by(() => {
    const counts = new Map<string, number>();
    for (const e of trackerFilteredEvents) {
      counts.set(e.eventName, (counts.get(e.eventName) || 0) + 1);
    }
    return counts;
  });

  // Final filtered events (with event type filter applied)
  let filteredEvents = $derived.by(() => {
    if (activeEventTypes.size === 0) return trackerFilteredEvents;
    return trackerFilteredEvents.filter((e) => activeEventTypes.has(e.eventName));
  });

  function toggleEventType(name: string) {
    const next = new Set(activeEventTypes);
    if (next.has(name)) {
      next.delete(name);
    } else {
      next.add(name);
    }
    activeEventTypes = next;
  }
</script>

<!-- Search -->
<div class="flex items-center gap-1 px-2 py-1.5 border-b border-gray-200 dark:border-gray-700 shrink-0">
  <input
    type="text"
    placeholder={t("events.search")}
    bind:value={searchQuery}
    class="flex-1 px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 focus:bg-white dark:focus:bg-gray-700 min-w-0"
  />
</div>

<!-- Tracker filter -->
<TrackerFilter {events} bind:activeTrackers />

<!-- Event type filter -->
{#if eventTypeCounts.size >= 2}
  <div class="border-b border-gray-200 shrink-0">
    <button
      onclick={() => (eventTypeFilterOpen = !eventTypeFilterOpen)}
      class="flex items-center gap-1 px-3 py-1 text-[10px] text-gray-400 uppercase tracking-wide hover:text-gray-600 w-full"
    >
      <span class="transition-transform {eventTypeFilterOpen ? 'rotate-90' : ''}" style="display:inline-block">&#9654;</span>
      Event Types
      {#if activeEventTypes.size > 0}
        <span class="text-indigo-500 normal-case tracking-normal">({activeEventTypes.size} selected)</span>
      {/if}
    </button>
    {#if eventTypeFilterOpen}
      <div class="flex items-center gap-1 px-3 pb-1.5 flex-wrap">
        {#each [...eventTypeCounts.entries()].sort((a, b) => b[1] - a[1]) as [name, count]}
          {@const active = activeEventTypes.size === 0 || activeEventTypes.has(name)}
          <button
            onclick={() => toggleEventType(name)}
            class="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] rounded-full transition-all border {active ? 'bg-indigo-50 border-indigo-200 text-indigo-700 opacity-100' : 'bg-gray-50 border-gray-200 text-gray-400 opacity-50'}"
          >
            {name}
            <span class="font-mono text-[9px] opacity-60">x{count}</span>
          </button>
        {/each}
      </div>
    {/if}
  </div>
{/if}

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
