<script lang="ts">
  interface Props {
    searchQuery: string;
    paused: boolean;
    eventCount: number;
    onTogglePause: () => void;
    onClear: () => void;
    onExport: (format: "json" | "csv") => void;
  }

  let { searchQuery = $bindable(), paused, eventCount, onTogglePause, onClear, onExport }: Props = $props();

  let showExportMenu = $state(false);
</script>

<div class="flex items-center gap-2 px-3 py-2 bg-[#252526] border-b border-[#3c3c3c] shrink-0">
  <span class="text-sm font-semibold text-[#cccccc] mr-2">TrackSight</span>

  <button
    onclick={onClear}
    class="px-2 py-1 text-xs rounded bg-[#3c3c3c] hover:bg-[#505050] text-[#cccccc] transition-colors"
    title="Clear all events"
  >
    Clear
  </button>

  <button
    onclick={onTogglePause}
    class="px-2 py-1 text-xs rounded transition-colors {paused ? 'bg-yellow-600 hover:bg-yellow-500 text-white' : 'bg-[#3c3c3c] hover:bg-[#505050] text-[#cccccc]'}"
    title={paused ? "Resume capturing" : "Pause capturing"}
  >
    {paused ? "▶ Resume" : "⏸ Pause"}
  </button>

  <div class="relative">
    <button
      onclick={() => (showExportMenu = !showExportMenu)}
      class="px-2 py-1 text-xs rounded bg-[#3c3c3c] hover:bg-[#505050] text-[#cccccc] transition-colors"
    >
      Export ▾
    </button>
    {#if showExportMenu}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="absolute top-full left-0 mt-1 bg-[#3c3c3c] rounded shadow-lg z-10 min-w-[100px]"
        onmouseleave={() => (showExportMenu = false)}
      >
        <button
          onclick={() => { onExport("json"); showExportMenu = false; }}
          class="block w-full text-left px-3 py-1.5 text-xs text-[#cccccc] hover:bg-[#505050]"
        >JSON</button>
        <button
          onclick={() => { onExport("csv"); showExportMenu = false; }}
          class="block w-full text-left px-3 py-1.5 text-xs text-[#cccccc] hover:bg-[#505050]"
        >CSV</button>
      </div>
    {/if}
  </div>

  <div class="flex-1"></div>

  <input
    type="text"
    placeholder="Search events..."
    bind:value={searchQuery}
    class="px-2 py-1 text-xs rounded bg-[#3c3c3c] border border-[#505050] text-[#cccccc] placeholder-[#808080] w-64 focus:outline-none focus:border-[#007acc]"
  />

  <span class="text-xs text-[#808080] ml-2">{eventCount} events</span>
</div>
