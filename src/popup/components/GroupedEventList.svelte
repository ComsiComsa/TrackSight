<script lang="ts">
  import type { ParsedEvent } from "../../types";
  import { TRACKER_COLORS } from "../../types";

  interface Props {
    events: ParsedEvent[];
    t: (key: string) => string;
    onSelect: (event: ParsedEvent) => void;
  }

  let { events, t, onSelect }: Props = $props();

  let listContainer: HTMLDivElement | undefined = $state();
  let prevEventCount = $state(0);

  $effect(() => {
    const count = events.length;
    if (count > prevEventCount && listContainer) {
      const { scrollTop, scrollHeight, clientHeight } = listContainer;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      if (isNearBottom) {
        requestAnimationFrame(() => {
          listContainer?.scrollTo({ top: listContainer.scrollHeight, behavior: "smooth" });
        });
      }
    }
    prevEventCount = count;
  });

  // Group by trackerName (so custom trackers get their own group)
  let grouped = $derived.by(() => {
    const groups = new Map<string, { color: string; events: ParsedEvent[] }>();
    for (const e of events) {
      const key = e.trackerName;
      const existing = groups.get(key);
      if (existing) {
        existing.events.push(e);
      } else {
        groups.set(key, {
          color: TRACKER_COLORS[e.tracker] || TRACKER_COLORS.unknown,
          events: [e],
        });
      }
    }
    return [...groups.entries()].sort((a, b) => b[1].events.length - a[1].events.length);
  });

  let collapsed = $state<Set<string>>(new Set());

  function toggleGroup(key: string) {
    const next = new Set(collapsed);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    collapsed = next;
  }

  function formatTime(ts: number): string {
    return new Date(ts).toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }
</script>

<div class="flex-1 overflow-auto min-h-0" bind:this={listContainer}>
  {#if events.length === 0}
    <div class="flex flex-col items-center justify-center h-full text-gray-400 px-6">
      <div class="text-3xl mb-2">📡</div>
      <p class="text-center text-xs">{t("events.empty")}</p>
      <p class="text-center text-[10px] mt-1">{t("events.empty.hint")}</p>
    </div>
  {:else}
    {#each grouped as [name, group]}
      {@const isCollapsed = collapsed.has(name)}
      <button
        class="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200 hover:bg-gray-100 transition-colors sticky top-0 z-[1]"
        onclick={() => toggleGroup(name)}
      >
        <span class="text-[10px] text-gray-400 w-3">{isCollapsed ? "▶" : "▼"}</span>
        <span
          class="px-1.5 py-0.5 rounded text-[10px] font-semibold"
          style="color: {group.color}; background-color: {group.color}18;"
        >{name}</span>
        <span class="text-[10px] text-gray-400 font-mono">{group.events.length}</span>
      </button>

      {#if !isCollapsed}
        {#each group.events as event}
          <button
            class="w-full text-left px-3 py-1.5 pl-8 border-b border-gray-100 hover:bg-indigo-50 transition-colors flex items-center gap-2"
            onclick={() => onSelect(event)}
          >
            <span class="font-medium text-gray-800 text-xs min-w-0 truncate">{event.eventName}</span>
            {#if event.metadata.trackingId}
              <span class="text-[10px] text-gray-400 font-mono truncate shrink-0">{event.metadata.trackingId}</span>
            {/if}
            <div class="flex-1"></div>
            <span class="shrink-0 text-[10px] text-gray-400 font-mono">{formatTime(event.timestamp)}</span>
          </button>
        {/each}
      {/if}
    {/each}
  {/if}
</div>
