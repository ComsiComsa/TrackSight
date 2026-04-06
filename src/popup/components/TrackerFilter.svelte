<script lang="ts">
  import type { ParsedEvent } from "../../types";
  import { TRACKER_COLORS } from "../../types";

  interface Props {
    events: ParsedEvent[];
    activeTrackers: Set<string>;
  }

  let { events, activeTrackers = $bindable() }: Props = $props();

  let trackerCounts = $derived.by(() => {
    const counts = new Map<string, { count: number; color: string }>();
    for (const e of events) {
      const key = e.trackerName;
      const existing = counts.get(key);
      if (existing) {
        existing.count++;
      } else {
        counts.set(key, { count: 1, color: TRACKER_COLORS[e.tracker] || TRACKER_COLORS.unknown });
      }
    }
    return counts;
  });

  function toggle(name: string) {
    const next = new Set(activeTrackers);
    if (next.has(name)) {
      next.delete(name);
    } else {
      next.add(name);
    }
    activeTrackers = next;
  }
</script>

{#if trackerCounts.size > 0}
  <div class="flex items-center gap-1 px-3 py-1.5 border-b border-gray-200 flex-wrap shrink-0">
    {#each [...trackerCounts.entries()].sort((a, b) => b[1].count - a[1].count) as [name, info]}
      {@const active = activeTrackers.size === 0 || activeTrackers.has(name)}
      <button
        onclick={() => toggle(name)}
        class="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-full transition-all {active ? 'opacity-100' : 'opacity-35'}"
        style="color: {info.color}; background-color: {info.color}15;"
      >
        {name}
        <span class="font-mono text-[10px] opacity-60">{info.count}</span>
      </button>
    {/each}
  </div>
{/if}
