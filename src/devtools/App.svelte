<script lang="ts">
  import type { ParsedEvent, Settings } from "../types";
  import { MSG, DEFAULT_SETTINGS, TRANSLATIONS } from "../types";
  import TrackerFilter from "../popup/components/TrackerFilter.svelte";
  import GroupedEventList from "../popup/components/GroupedEventList.svelte";
  import EventDetail from "../popup/components/EventDetail.svelte";
  import SettingsTab from "../popup/components/SettingsTab.svelte";

  let events = $state<ParsedEvent[]>([]);
  let paused = $state(false);
  let searchQuery = $state("");
  let activeTrackers = $state<Set<string>>(new Set());
  let selectedEvent = $state<ParsedEvent | null>(null);
  let connected = $state(false);
  let exportOpen = $state(false);
  let settings = $state<Settings>({ ...DEFAULT_SETTINGS });
  let activeTab = $state<"events" | "settings">("events");

  const tabId = chrome.devtools.inspectedWindow.tabId;
  let port: chrome.runtime.Port;

  async function loadSettings() {
    const result = await chrome.storage.local.get("settings");
    if (result.settings) settings = result.settings;
  }
  loadSettings();

  async function saveSettings(newSettings: Settings) {
    settings = newSettings;
    await chrome.storage.local.set({ settings: newSettings });
  }

  function t(key: string): string {
    return TRANSLATIONS[settings.language]?.[key] ?? TRANSLATIONS.en[key] ?? key;
  }

  let isDark = $derived(
    settings.theme === "dark" ||
    (settings.theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
  );

  function connect() {
    try {
      port = chrome.runtime.connect({ name: `devtools-${tabId}` });
      connected = true;

      port.onMessage.addListener((message) => {
        if (message.type === MSG.PARSED_EVENT && !paused) {
          events = [...events, message.payload];
        } else if (message.type === MSG.EVENTS_BATCH) {
          events = [...events, ...message.payload];
        }
      });

      port.onDisconnect.addListener(() => {
        connected = false;
        setTimeout(() => { try { connect(); } catch {} }, 1000);
      });

      port.postMessage({ type: MSG.GET_EVENTS, payload: { tabId } });
    } catch {
      connected = false;
      setTimeout(() => { try { connect(); } catch {} }, 1000);
    }
  }

  connect();

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

  function handleClear() {
    events = [];
    selectedEvent = null;
    try { port.postMessage({ type: MSG.CLEAR_EVENTS, payload: { tabId } }); } catch {}
  }

  function handleExport(format: "json" | "csv") {
    exportOpen = false;
    const data = filteredEvents;
    const ts = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
    let content: string;
    let filename: string;
    if (format === "json") {
      content = JSON.stringify(data, null, 2);
      filename = `tracksight-${ts}.json`;
    } else {
      const headers = ["timestamp", "tracker", "eventName", "eventType", "rawUrl"];
      const rows = data.map((e) =>
        headers.map((h) => JSON.stringify(String((e as Record<string, unknown>)[h] ?? ""))).join(",")
      );
      content = [headers.join(","), ...rows].join("\n");
      filename = `tracksight-${ts}.csv`;
    }
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<main class="w-full h-screen bg-white text-gray-900 text-sm flex flex-col {isDark ? 'dark' : ''}">
  <!-- Header -->
  <header class="bg-indigo-600 text-white px-3 h-10 flex items-center shrink-0">
    <h1 class="font-bold text-sm mr-3">TrackSight</h1>
    {#if activeTab === "events"}
      <span class="text-indigo-200 text-xs mr-2">{filteredEvents.length} {t("events.count")}</span>
    {:else}
      <span class="text-indigo-200 text-xs mr-2">{t("tab.settings")}</span>
    {/if}
    {#if activeTab === "events"}
      <div class="flex items-center gap-1">
        <!-- Record/Pause -->
        <button
          onclick={() => (paused = !paused)}
          class="p-1.5 rounded transition-colors hover:bg-indigo-500"
          title={paused ? t("events.paused") : t("events.recording")}
        >
          {#if paused}
            <svg class="w-4 h-4" viewBox="0 0 16 16" fill="currentColor"><path d="M4 2l10 6-10 6V2z"/></svg>
          {:else}
            <span class="inline-block w-3 h-3 rounded-full bg-red-400 animate-pulse"></span>
          {/if}
        </button>
        <!-- Clear -->
        <button onclick={handleClear} class="p-1.5 rounded transition-colors hover:bg-indigo-500" title={t("events.clear")}>
          <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 4h12M5.5 4V2.5h5V4M6 7v5M10 7v5M3.5 4l.5 9.5h8l.5-9.5"/></svg>
        </button>
        <!-- Export -->
        <div class="relative">
          <button onclick={() => (exportOpen = !exportOpen)} class="p-1.5 rounded transition-colors hover:bg-indigo-500" title={t("events.export")}>
            <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 2v9M4.5 7.5L8 11l3.5-3.5M2 13h12"/></svg>
          </button>
          {#if exportOpen}
            <div class="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-20 min-w-[90px] py-1">
              <button onclick={() => handleExport("json")} class="block w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100">JSON</button>
              <button onclick={() => handleExport("csv")} class="block w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100">CSV</button>
            </div>
          {/if}
        </div>
        <div class="w-px h-4 bg-indigo-400/50 mx-1"></div>
        <input
          type="text"
          placeholder={t("events.search")}
          bind:value={searchQuery}
          class="px-2 py-1 text-xs rounded border border-indigo-400/50 bg-indigo-500/50 text-white placeholder-indigo-300 w-52 focus:outline-none focus:bg-indigo-400/50"
        />
      </div>
    {/if}
    <div class="flex-1"></div>
    <!-- Settings gear -->
    <button
      onclick={() => (activeTab = activeTab === "settings" ? "events" : "settings")}
      class="p-1.5 rounded transition-colors {activeTab === 'settings' ? 'bg-indigo-500' : 'hover:bg-indigo-500/50'}"
      title={t("tab.settings")}
    >
      <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3">
        <circle cx="8" cy="8" r="2.5"/>
        <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M3.05 12.95l1.06-1.06M11.89 4.11l1.06-1.06"/>
      </svg>
    </button>
  </header>

  {#if activeTab === "settings"}
    <SettingsTab {settings} {t} onSave={saveSettings} />
  {:else}
    <TrackerFilter {events} bind:activeTrackers />

    {#if !connected}
      <div class="flex items-center justify-center gap-2 px-3 py-1.5 bg-yellow-50 border-b border-yellow-200 text-yellow-700 text-xs shrink-0">
        Reconnecting...
      </div>
    {/if}

    {#if selectedEvent}
      <EventDetail event={selectedEvent} {t} onBack={() => (selectedEvent = null)} />
    {:else}
      <GroupedEventList events={filteredEvents} {t} onSelect={(e) => (selectedEvent = e)} />
    {/if}
  {/if}
</main>
