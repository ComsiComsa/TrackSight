<script lang="ts">
  import type { ParsedEvent } from "../../types";
  import { TRACKER_COLORS, TRACKER_NAMES } from "../../types";

  interface Props {
    event: ParsedEvent;
    onClose: () => void;
  }

  let { event, onClose }: Props = $props();

  let viewMode = $state<"parsed" | "raw">("parsed");
</script>

<div class="w-[400px] border-l border-[#3c3c3c] bg-[#252526] flex flex-col shrink-0 overflow-hidden">
  <!-- Header -->
  <div class="flex items-center justify-between px-3 py-2 border-b border-[#3c3c3c]">
    <div class="flex items-center gap-2">
      <span
        class="px-1.5 py-0.5 rounded text-[10px] font-medium"
        style="background-color: {TRACKER_COLORS[event.tracker]}25; color: {TRACKER_COLORS[event.tracker]}"
      >
        {TRACKER_NAMES[event.tracker]}
      </span>
      <span class="text-sm font-mono text-[#dcdcaa]">{event.eventName}</span>
    </div>
    <button
      onclick={onClose}
      class="text-[#808080] hover:text-[#cccccc] text-lg leading-none"
      title="Close"
    >×</button>
  </div>

  <!-- View mode toggle -->
  <div class="flex gap-1 px-3 py-1.5 border-b border-[#3c3c3c]">
    <button
      onclick={() => (viewMode = "parsed")}
      class="px-2 py-0.5 text-xs rounded {viewMode === 'parsed' ? 'bg-[#007acc] text-white' : 'text-[#808080] hover:text-[#cccccc]'}"
    >Parsed</button>
    <button
      onclick={() => (viewMode = "raw")}
      class="px-2 py-0.5 text-xs rounded {viewMode === 'raw' ? 'bg-[#007acc] text-white' : 'text-[#808080] hover:text-[#cccccc]'}"
    >Raw URL</button>
  </div>

  <!-- Content -->
  <div class="flex-1 overflow-auto p-3 text-xs">
    {#if viewMode === "parsed"}
      <!-- Event Type -->
      <div class="mb-3">
        <div class="text-[#808080] mb-0.5">Event Type</div>
        <div class="text-[#ce9178]">{event.eventType}</div>
      </div>

      <!-- Metadata -->
      {#if Object.keys(event.metadata).length > 0}
        <div class="mb-3">
          <div class="text-[#808080] mb-1">Metadata</div>
          {#each Object.entries(event.metadata).filter(([_, v]) => v) as [key, value]}
            <div class="flex gap-2 py-0.5">
              <span class="text-[#9cdcfe] font-mono shrink-0">{key}:</span>
              <span class="text-[#ce9178] font-mono break-all">{value}</span>
            </div>
          {/each}
        </div>
      {/if}

      <!-- Parameters -->
      <div class="mb-3">
        <div class="text-[#808080] mb-1">Parameters ({Object.keys(event.parameters).length})</div>
        <div class="bg-[#1e1e1e] rounded p-2 max-h-[400px] overflow-auto">
          {#each Object.entries(event.parameters) as [key, value]}
            <div class="flex gap-2 py-0.5 border-b border-[#2d2d2d] last:border-0">
              <span class="text-[#9cdcfe] font-mono shrink-0 min-w-[80px]">{key}</span>
              <span class="text-[#ce9178] font-mono break-all">{value}</span>
            </div>
          {/each}
        </div>
      </div>

      <!-- Full Payload -->
      {#if event.payload && typeof event.payload === "object"}
        <div>
          <div class="text-[#808080] mb-1">Full Payload</div>
          <pre class="bg-[#1e1e1e] rounded p-2 overflow-auto text-[11px] text-[#d4d4d4] whitespace-pre-wrap break-all max-h-[300px]">{JSON.stringify(event.payload, null, 2)}</pre>
        </div>
      {/if}
    {:else}
      <!-- Raw URL -->
      <div>
        <div class="text-[#808080] mb-1">Raw URL</div>
        <pre class="bg-[#1e1e1e] rounded p-2 overflow-auto text-[11px] text-[#d4d4d4] whitespace-pre-wrap break-all">{event.rawUrl}</pre>
      </div>
    {/if}
  </div>

  <!-- Footer -->
  <div class="px-3 py-1.5 border-t border-[#3c3c3c] text-[10px] text-[#808080]">
    {new Date(event.timestamp).toLocaleTimeString()} · {event.tracker}
  </div>
</div>
