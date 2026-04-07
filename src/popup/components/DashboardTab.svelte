<script lang="ts">
  import type { ParsedEvent } from "../../types";
  import { TRACKER_COLORS } from "../../types";

  interface Props {
    events: ParsedEvent[];
    t: (key: string) => string;
    onSelectTracker: (trackerName: string) => void;
  }

  let { events, t, onSelectTracker }: Props = $props();

  let searchQuery = $state("");

  interface TrackerSummary {
    tracker: string;
    trackerName: string;
    color: string;
    eventCount: number;
    trackingIds: Set<string>;
    eventTypes: Map<string, number>;
    firstSeen: number;
    lastSeen: number;
    lastEventName: string;
    sources: Set<string>;
  }

  let trackers = $derived.by(() => {
    const map = new Map<string, TrackerSummary>();

    for (const e of events) {
      const key = e.trackerName;
      const existing = map.get(key);

      if (existing) {
        existing.eventCount++;
        if (e.metadata.trackingId) existing.trackingIds.add(e.metadata.trackingId);
        existing.eventTypes.set(e.eventName, (existing.eventTypes.get(e.eventName) || 0) + 1);
        if (e.timestamp < existing.firstSeen) existing.firstSeen = e.timestamp;
        if (e.timestamp > existing.lastSeen) {
          existing.lastSeen = e.timestamp;
          existing.lastEventName = e.eventName;
        }
        if ((e as any).source) existing.sources.add((e as any).source);
      } else {
        const summary: TrackerSummary = {
          tracker: e.tracker,
          trackerName: key,
          color: TRACKER_COLORS[e.tracker] || TRACKER_COLORS.unknown,
          eventCount: 1,
          trackingIds: new Set(e.metadata.trackingId ? [e.metadata.trackingId] : []),
          eventTypes: new Map([[e.eventName, 1]]),
          firstSeen: e.timestamp,
          lastSeen: e.timestamp,
          lastEventName: e.eventName,
          sources: new Set((e as any).source ? [(e as any).source] : []),
        };
        map.set(key, summary);
      }
    }

    return [...map.values()].sort((a, b) => b.eventCount - a.eventCount);
  });

  function formatTime(ts: number): string {
    return new Date(ts).toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  function topEvents(eventTypes: Map<string, number>, limit = 3): [string, number][] {
    return [...eventTypes.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
  }

  let filteredTrackers = $derived.by(() => {
    if (!searchQuery) return trackers;
    const q = searchQuery.toLowerCase();
    return trackers.filter((tr) => {
      if (tr.trackerName.toLowerCase().includes(q)) return true;
      for (const id of tr.trackingIds) {
        if (id.toLowerCase().includes(q)) return true;
      }
      for (const name of tr.eventTypes.keys()) {
        if (name.toLowerCase().includes(q)) return true;
      }
      return false;
    });
  });
</script>

<div class="flex-1 overflow-auto min-h-0">
  {#if events.length === 0}
    <div class="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 px-6">
      <div class="text-3xl mb-2">📡</div>
      <p class="text-center text-xs">{t("events.empty")}</p>
      <p class="text-center text-[10px] mt-1">{t("events.empty.hint")}</p>
    </div>
  {:else}
    <!-- Summary bar -->
    <div class="flex items-center gap-3 px-3 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shrink-0">
      <div class="flex items-center gap-1.5">
        <span class="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t("dashboard.trackers")}</span>
        <span class="text-sm font-bold text-gray-800 dark:text-gray-100">{trackers.length}</span>
      </div>
      <div class="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
      <div class="flex items-center gap-1.5">
        <span class="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t("events.count")}</span>
        <span class="text-sm font-bold text-gray-800 dark:text-gray-100">{events.length}</span>
      </div>
      <div class="flex-1"></div>
      <div class="flex gap-1">
        {#each trackers as tr}
          <span
            class="w-2 h-2 rounded-full"
            style="background-color: {tr.color};"
            title={tr.trackerName}
          ></span>
        {/each}
      </div>
    </div>

    <!-- Search -->
    <div class="flex items-center gap-1 px-2 py-1.5 border-b border-gray-200 dark:border-gray-700 shrink-0">
      <input
        type="text"
        placeholder="Search trackers, IDs, events..."
        bind:value={searchQuery}
        class="flex-1 px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 focus:bg-white dark:focus:bg-gray-700 min-w-0"
      />
    </div>

    <!-- Tracker cards -->
    <div class="p-2 flex flex-col gap-2">
      {#each filteredTrackers as tr}
        <button
          class="w-full text-left rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-sm transition-all p-3"
          onclick={() => onSelectTracker(tr.trackerName)}
        >
          <!-- Header row -->
          <div class="flex items-center gap-2 mb-2">
            <span
              class="w-2.5 h-2.5 rounded-full shrink-0"
              style="background-color: {tr.color};"
            ></span>
            <span
              class="font-semibold text-xs"
              style="color: {tr.color};"
            >{tr.trackerName}</span>
            <span class="ml-auto text-[10px] font-mono text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
              {tr.eventCount} {t("events.count")}
            </span>
          </div>

          <!-- Tracking IDs -->
          {#if tr.trackingIds.size > 0}
            <div class="flex items-start gap-1 mb-1.5">
              <span class="text-[10px] text-gray-400 dark:text-gray-500 shrink-0 mt-0.5">ID:</span>
              <div class="flex flex-wrap gap-1">
                {#each [...tr.trackingIds] as id}
                  <span class="text-[10px] font-mono bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded">{id}</span>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Top events -->
          <div class="flex items-start gap-1 mb-1.5">
            <span class="text-[10px] text-gray-400 dark:text-gray-500 shrink-0 mt-0.5">{t("dashboard.topEvents")}:</span>
            <div class="flex flex-wrap gap-1">
              {#each topEvents(tr.eventTypes) as [name, count]}
                <span class="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded">
                  {name} <span class="text-gray-400 dark:text-gray-500 font-mono">x{count}</span>
                </span>
              {/each}
              {#if tr.eventTypes.size > 3}
                <span class="text-[10px] text-gray-400 dark:text-gray-500">+{tr.eventTypes.size - 3}</span>
              {/if}
            </div>
          </div>

          <!-- Footer: time range -->
          <div class="flex items-center gap-2 text-[10px] text-gray-400 dark:text-gray-500 font-mono">
            <span>{t("dashboard.first")}: {formatTime(tr.firstSeen)}</span>
            <span>·</span>
            <span>{t("dashboard.last")}: {formatTime(tr.lastSeen)}</span>
            {#if tr.eventTypes.size > 0}
              <span>·</span>
              <span class="text-gray-500 dark:text-gray-400">{tr.eventTypes.size} {t("dashboard.uniqueEvents")}</span>
            {/if}
          </div>
        </button>
      {/each}
    </div>
  {/if}
</div>
