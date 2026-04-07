<script lang="ts">
  import type { ParsedEvent, Settings } from "../types";
  import { MSG, DEFAULT_SETTINGS, TRANSLATIONS } from "../types";
  import DashboardTab from "./components/DashboardTab.svelte";
  import EventsTab from "./components/EventsTab.svelte";
  import SettingsTab from "./components/SettingsTab.svelte";

  let events = $state<ParsedEvent[]>([]);
  let paused = $state(false);
  let activeTab = $state<"dashboard" | "events" | "settings">("dashboard");
  let settings = $state<Settings>({ ...DEFAULT_SETTINGS });
  let initialTrackerFilter = $state<string | null>(null);
  let currentTabId = $state<number | null>(null);
  let exportOpen = $state(false);
  let port: chrome.runtime.Port;

  function t(key: string): string {
    return TRANSLATIONS[settings.language]?.[key] ?? TRANSLATIONS.en[key] ?? key;
  }

  let isDark = $derived(
    settings.theme === "dark" ||
    (settings.theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
  );

  async function loadSettings() {
    const result = await chrome.storage.local.get("settings");
    if (result.settings) {
      settings = { ...DEFAULT_SETTINGS, ...result.settings, customTrackers: result.settings.customTrackers ?? [], keywordRules: result.settings.keywordRules ?? [] };
    }
  }

  async function saveSettings(newSettings: Settings) {
    settings = newSettings;
    await chrome.storage.local.set({ settings: newSettings });
  }

  async function init() {
    await loadSettings();
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (!tab?.id) return;
    currentTabId = tab.id;

    try {
      port = chrome.runtime.connect({ name: `popup-${tab.id}` });

      port.onMessage.addListener((message) => {
        if (message.type === MSG.PARSED_EVENT && !paused) {
          events = [...events, message.payload];
        } else if (message.type === MSG.EVENTS_BATCH) {
          events = [...events, ...message.payload];
        }
      });

      port.postMessage({ type: MSG.GET_EVENTS, payload: { tabId: tab.id } });
    } catch {}
  }

  init();

  function handleClear() {
    events = [];
    if (currentTabId) {
      try { port.postMessage({ type: MSG.CLEAR_EVENTS, payload: { tabId: currentTabId } }); } catch {}
    }
  }

  function handleExport(format: "json" | "csv") {
    exportOpen = false;
    const data = events;
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

<main class="w-[500px] h-[600px] bg-white text-gray-900 text-sm flex flex-col {isDark ? 'dark' : ''}">
  <!-- Header — fixed layout, never jumps -->
  <header class="bg-indigo-600 text-white px-3 h-10 flex items-center shrink-0">
    <!-- Left: title + tabs -->
    <h1 class="font-bold text-sm mr-2">{t("app.title")}</h1>

    <div class="flex items-center gap-0.5">
      <button
        onclick={() => (activeTab = "dashboard")}
        class="p-1.5 rounded transition-colors {activeTab === 'dashboard' ? 'bg-indigo-500' : 'text-indigo-200 hover:bg-indigo-500/50'}"
        title={t("tab.dashboard")}
      >
        <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="3" rx="1"/><rect x="9" y="6" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="3" rx="1"/></svg>
      </button>
      <button
        onclick={() => { activeTab = "events"; initialTrackerFilter = null; }}
        class="p-1.5 rounded transition-colors {activeTab === 'events' ? 'bg-indigo-500' : 'text-indigo-200 hover:bg-indigo-500/50'}"
        title={t("tab.events")}
      >
        <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 4h12M2 8h9M2 12h6"/></svg>
      </button>
    </div>

    <!-- Center: event count -->
    <span class="text-indigo-200 text-xs tabular-nums ml-2">{events.length} {t("events.count")}</span>

    <div class="flex-1"></div>

    <!-- Right: always-visible controls -->
    <div class="flex items-center gap-0.5">
      <!-- Record/Pause -->
      <button
        onclick={() => (paused = !paused)}
        class="p-1.5 rounded transition-colors hover:bg-indigo-500/50"
        title={paused ? t("events.paused") : t("events.recording")}
      >
        {#if paused}
          <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor"><path d="M4 2l10 6-10 6V2z"/></svg>
        {:else}
          <span class="inline-block w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse"></span>
        {/if}
      </button>

      <!-- Clear -->
      <button onclick={handleClear} class="p-1.5 rounded transition-colors hover:bg-indigo-500/50" title={t("events.clear")}>
        <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 4h12M5.5 4V2.5h5V4M6 7v5M10 7v5M3.5 4l.5 9.5h8l.5-9.5"/></svg>
      </button>

      <!-- Export -->
      <div class="relative">
        <button onclick={() => (exportOpen = !exportOpen)} class="p-1.5 rounded transition-colors hover:bg-indigo-500/50" title={t("events.export")}>
          <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 2v9M4.5 7.5L8 11l3.5-3.5M2 13h12"/></svg>
        </button>
        {#if exportOpen}
          <div class="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-30 min-w-[90px] py-1">
            <button onclick={() => handleExport("json")} class="block w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100">JSON</button>
            <button onclick={() => handleExport("csv")} class="block w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100">CSV</button>
          </div>
        {/if}
      </div>

      <!-- Settings gear -->
      <button
        onclick={() => (activeTab = activeTab === "settings" ? "dashboard" : "settings")}
        class="p-1.5 rounded transition-colors {activeTab === 'settings' ? 'bg-indigo-500' : 'hover:bg-indigo-500/50'}"
        title={t("tab.settings")}
      >
        <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3">
          <circle cx="8" cy="8" r="2.5"/>
          <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M3.05 12.95l1.06-1.06M11.89 4.11l1.06-1.06"/>
        </svg>
      </button>
    </div>
  </header>

  {#if activeTab === "dashboard"}
    <DashboardTab
      {events}
      {t}
      onSelectTracker={(name) => { initialTrackerFilter = name; activeTab = "events"; }}
    />
  {:else if activeTab === "events"}
    <EventsTab
      {events}
      {t}
      {initialTrackerFilter}
    />
  {:else}
    <SettingsTab {settings} {t} onSave={saveSettings} />
  {/if}
</main>
