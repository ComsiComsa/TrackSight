<script lang="ts">
  import type { ParsedEvent } from "../../types";
  import { TRACKER_COLORS } from "../../types";

  interface Props {
    event: ParsedEvent;
    t: (key: string) => string;
    onBack: () => void;
  }

  let { event, t, onBack }: Props = $props();
  let viewMode = $state<"parsed" | "raw">("parsed");
  let showPayload = $state(false);
  let copiedKey = $state<string | null>(null);

  function copyValue(key: string, value: string) {
    navigator.clipboard.writeText(value);
    copiedKey = key;
    setTimeout(() => (copiedKey = null), 1500);
  }

  // Separate parameters into meaningful groups
  let paramGroups = $derived.by(() => {
    const entries = Object.entries(event.parameters);
    const custom: [string, string][] = [];
    const technical: [string, string][] = [];

    for (const [k, v] of entries) {
      // Technical/internal params: short cryptic keys, IDs, hashes, versions
      if (
        k.length <= 3 ||
        k.startsWith("_") ||
        k.startsWith("$") ||
        ["v", "r", "ec", "o", "sw", "sh", "if", "fbp", "fbc", "it", "fmt"].includes(k)
      ) {
        technical.push([k, v]);
      } else {
        custom.push([k, v]);
      }
    }
    return { custom, technical };
  });

  // Format raw URL into readable decoded params
  let formattedRawUrl = $derived.by(() => {
    try {
      const url = new URL(event.rawUrl);
      const base = `${url.protocol}//${url.host}${url.pathname}`;
      const params = [...url.searchParams.entries()];
      if (params.length === 0) return event.rawUrl;
      return base + "\n" + params.map(([k, v]) => `  ${k} = ${decodeURIComponent(v)}`).join("\n");
    } catch {
      return event.rawUrl;
    }
  });

  function formatTime(ts: number): string {
    return new Date(ts).toLocaleTimeString("en-US", {
      hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  }
</script>

<div class="flex-1 overflow-auto min-h-0 flex flex-col">
  <!-- Header -->
  <div class="flex items-center gap-2 px-3 py-2 border-b border-gray-200 shrink-0">
    <button onclick={onBack} class="text-gray-400 hover:text-gray-600 text-xs">&larr; {t("detail.back")}</button>
    <span
      class="px-1.5 py-0.5 rounded text-[10px] font-semibold"
      style="color: {TRACKER_COLORS[event.tracker]}; background-color: {TRACKER_COLORS[event.tracker]}18;"
    >{event.trackerName}</span>
    <span class="font-semibold text-sm text-gray-900 flex-1 truncate">{event.eventName}</span>
    <span class="text-[10px] text-gray-400 font-mono shrink-0">{formatTime(event.timestamp)}</span>
  </div>

  <!-- Tabs -->
  <div class="flex gap-1 px-3 py-1.5 border-b border-gray-200 shrink-0">
    <button
      onclick={() => (viewMode = "parsed")}
      class="px-2 py-0.5 text-xs rounded {viewMode === 'parsed' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}"
    >{t("detail.parsed")}</button>
    <button
      onclick={() => (viewMode = "raw")}
      class="px-2 py-0.5 text-xs rounded {viewMode === 'raw' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}"
    >{t("detail.raw")}</button>
  </div>

  <div class="flex-1 overflow-auto">
    {#if viewMode === "parsed"}
      <!-- Metadata (only if meaningful) -->
      {#if Object.entries(event.metadata).filter(([_, v]) => v).length > 0}
        <div class="px-3 py-2 border-b border-gray-100">
          {#each Object.entries(event.metadata).filter(([_, v]) => v) as [key, value]}
            <div class="flex items-center gap-2 text-xs">
              <span class="text-gray-400 w-24 shrink-0">{key}</span>
              <span class="text-gray-700 font-mono truncate">{value}</span>
              <button
                onclick={() => copyValue(key, String(value))}
                class="shrink-0 text-gray-300 hover:text-gray-500 text-[10px]"
              >{copiedKey === key ? "copied" : "copy"}</button>
            </div>
          {/each}
        </div>
      {/if}

      <!-- Main parameters (human-readable) -->
      {#if paramGroups.custom.length > 0}
        <div class="px-3 pt-2 pb-1">
          <div class="text-[10px] uppercase tracking-wide text-gray-400 mb-1">{t("detail.parameters")} ({paramGroups.custom.length})</div>
        </div>
        <div class="mx-3 mb-2 bg-gray-50 rounded-lg border border-gray-200 divide-y divide-gray-100 overflow-hidden">
          {#each paramGroups.custom as [key, value]}
            <div class="flex items-start gap-2 px-2.5 py-1.5 text-xs group">
              <span class="text-indigo-600 font-mono shrink-0 min-w-[90px] pt-px">{key}</span>
              <span class="text-gray-700 font-mono break-all flex-1 select-all">{value}</span>
              <button
                onclick={() => copyValue(key, value)}
                class="shrink-0 text-gray-300 hover:text-gray-500 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity pt-px"
              >{copiedKey === key ? "✓" : "⎘"}</button>
            </div>
          {/each}
        </div>
      {/if}

      <!-- Technical params (collapsed by default if there are custom params) -->
      {#if paramGroups.technical.length > 0}
        <div class="px-3 pt-1 pb-1">
          <button
            onclick={() => (showPayload = !showPayload)}
            class="text-[10px] uppercase tracking-wide text-gray-400 hover:text-gray-600"
          >
            {showPayload ? "▼" : "▶"} Technical ({paramGroups.technical.length})
          </button>
        </div>
        {#if showPayload || paramGroups.custom.length === 0}
          <div class="mx-3 mb-2 bg-gray-50 rounded-lg border border-gray-200 divide-y divide-gray-100 overflow-hidden">
            {#each paramGroups.technical as [key, value]}
              <div class="flex items-start gap-2 px-2.5 py-1 text-[11px] group">
                <span class="text-gray-400 font-mono shrink-0 min-w-[50px]">{key}</span>
                <span class="text-gray-500 font-mono break-all flex-1 select-all">{value}</span>
              </div>
            {/each}
          </div>
        {/if}
      {/if}

      <!-- Full Payload (collapsible) -->
      {#if event.payload && typeof event.payload === "object"}
        <div class="px-3 pt-1 pb-2">
          <button
            onclick={() => {
              const el = document.getElementById("payload-block");
              if (el) el.classList.toggle("hidden");
            }}
            class="text-[10px] uppercase tracking-wide text-gray-400 hover:text-gray-600"
          >▶ {t("detail.payload")}</button>
          <pre id="payload-block" class="hidden mt-1 bg-gray-50 rounded-lg border border-gray-200 p-2 overflow-auto text-[11px] text-gray-600 whitespace-pre-wrap break-all max-h-[300px] select-all">{JSON.stringify(event.payload, null, 2)}</pre>
        </div>
      {/if}

    {:else}
      <!-- Raw: formatted URL with decoded params -->
      <div class="p-3">
        <div class="text-[10px] uppercase tracking-wide text-gray-400 mb-1">{t("detail.raw_url")}</div>
        <pre class="bg-gray-50 rounded-lg border border-gray-200 p-3 overflow-auto text-[11px] text-gray-700 whitespace-pre-wrap break-all select-all">{formattedRawUrl}</pre>
      </div>
    {/if}
  </div>
</div>
