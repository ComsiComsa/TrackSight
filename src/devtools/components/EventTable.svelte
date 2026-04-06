<script lang="ts">
  import type { ParsedEvent } from "../../types";
  import { TRACKER_COLORS, TRACKER_NAMES } from "../../types";

  interface Props {
    events: ParsedEvent[];
    selectedEvent: ParsedEvent | null;
    onSelect: (event: ParsedEvent) => void;
  }

  let { events, selectedEvent, onSelect }: Props = $props();

  let container: HTMLDivElement;
  let autoScroll = $state(true);

  $effect(() => {
    if (events.length && autoScroll && container) {
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
      });
    }
  });

  function handleScroll() {
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    autoScroll = scrollHeight - scrollTop - clientHeight < 50;
  }

  function formatTime(ts: number): string {
    return new Date(ts).toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  function summarize(event: ParsedEvent): string {
    const parts: string[] = [];
    if (event.metadata.trackingId) parts.push(event.metadata.trackingId);
    const paramKeys = Object.keys(event.parameters);
    if (paramKeys.length > 0) {
      const preview = paramKeys.slice(0, 2).map((k) => `${k}=${event.parameters[k]}`);
      parts.push(preview.join(", "));
    }
    return parts.join(" · ") || event.rawUrl.slice(0, 60);
  }
</script>

<div
  class="flex-1 overflow-auto min-w-0"
  bind:this={container}
  onscroll={handleScroll}
>
  <table class="w-full text-xs border-collapse">
    <thead class="sticky top-0 bg-[#252526] z-10">
      <tr class="text-left text-[#808080]">
        <th class="px-2 py-1.5 font-medium w-8">#</th>
        <th class="px-2 py-1.5 font-medium w-20">Time</th>
        <th class="px-2 py-1.5 font-medium w-24">Tracker</th>
        <th class="px-2 py-1.5 font-medium w-40">Event</th>
        <th class="px-2 py-1.5 font-medium">Details</th>
      </tr>
    </thead>
    <tbody>
      {#each events as event, i}
        {@const isSelected = selectedEvent?.id === event.id}
        <tr
          class="border-b border-[#2d2d2d] cursor-pointer transition-colors {isSelected ? 'bg-[#094771]' : 'hover:bg-[#2a2d2e]'}"
          onclick={() => onSelect(event)}
        >
          <td class="px-2 py-1 text-[#808080] font-mono">{i + 1}</td>
          <td class="px-2 py-1 text-[#808080] font-mono">{formatTime(event.timestamp)}</td>
          <td class="px-2 py-1">
            <span
              class="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium"
              style="background-color: {TRACKER_COLORS[event.tracker]}25; color: {TRACKER_COLORS[event.tracker]}"
            >
              {TRACKER_NAMES[event.tracker]}
            </span>
          </td>
          <td class="px-2 py-1 text-[#dcdcaa] font-mono truncate max-w-[160px]">{event.eventName}</td>
          <td class="px-2 py-1 text-[#9cdcfe] truncate">{summarize(event)}</td>
        </tr>
      {/each}
      {#if events.length === 0}
        <tr>
          <td colspan="5" class="px-4 py-12 text-center text-[#808080]">
            No analytics events captured yet. Navigate to a page with analytics trackers.
          </td>
        </tr>
      {/if}
    </tbody>
  </table>
</div>
