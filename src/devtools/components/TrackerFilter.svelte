<script lang="ts">
  import type { ParsedEvent, TrackerType } from "../../types";
  import { TRACKER_COLORS, TRACKER_NAMES } from "../../types";

  interface Props {
    events: ParsedEvent[];
    activeTrackers: Set<string>;
  }

  let { events, activeTrackers = $bindable() }: Props = $props();

  let trackerCounts = $derived.by(() => {
    const counts = new Map<TrackerType, number>();
    for (const e of events) {
      counts.set(e.tracker, (counts.get(e.tracker) ?? 0) + 1);
    }
    return counts;
  });

  function toggle(tracker: string) {
    const next = new Set(activeTrackers);
    if (next.has(tracker)) {
      next.delete(tracker);
    } else {
      next.add(tracker);
    }
    activeTrackers = next;
  }
</script>

{#if trackerCounts.size > 0}
  <div class="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e1e1e] border-b border-[#3c3c3c] shrink-0 flex-wrap">
    {#each [...trackerCounts.entries()].sort((a, b) => b[1] - a[1]) as [tracker, count]}
      {@const active = activeTrackers.size === 0 || activeTrackers.has(tracker)}
      <button
        onclick={() => toggle(tracker)}
        class="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full transition-all {active ? 'opacity-100' : 'opacity-40'}"
        style="background-color: {TRACKER_COLORS[tracker]}20; color: {TRACKER_COLORS[tracker]}; border: 1px solid {TRACKER_COLORS[tracker]}{active ? '80' : '30'}"
      >
        <span>{TRACKER_NAMES[tracker] ?? tracker}</span>
        <span class="font-mono text-[10px] opacity-70">{count}</span>
      </button>
    {/each}
  </div>
{/if}
