<script lang="ts">
  import type { ParsedEvent, Settings } from "../types";
  import { MSG, DEFAULT_SETTINGS, TRANSLATIONS } from "../types";
  import EventsTab from "./components/EventsTab.svelte";
  import SettingsTab from "./components/SettingsTab.svelte";

  let events = $state<ParsedEvent[]>([]);
  let paused = $state(false);
  let activeTab = $state<"events" | "settings">("events");
  let settings = $state<Settings>({ ...DEFAULT_SETTINGS });
  let currentTabId = $state<number | null>(null);
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
    if (result.settings) settings = result.settings;
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
</script>

<main class="w-[500px] h-[600px] bg-white text-gray-900 text-sm flex flex-col {isDark ? 'dark' : ''}">
  <!-- Header — fixed height -->
  <header class="bg-indigo-600 text-white px-3 h-10 flex items-center shrink-0">
    <h1 class="font-bold text-sm mr-3">{t("app.title")}</h1>

    {#if activeTab === "events"}
      <!-- Events toolbar: always present, same height -->
      <EventsTab
        {events}
        {paused}
        {t}
        onTogglePause={() => (paused = !paused)}
        onClear={handleClear}
        headerMode={true}
      />
    {:else}
      <span class="text-indigo-200 text-xs">{t("tab.settings")}</span>
    {/if}

    <div class="flex-1"></div>

    <!-- Settings gear icon -->
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

  {#if activeTab === "events"}
    <EventsTab
      {events}
      {paused}
      {t}
      onTogglePause={() => (paused = !paused)}
      onClear={handleClear}
      headerMode={false}
    />
  {:else}
    <SettingsTab {settings} {t} onSave={saveSettings} />
  {/if}
</main>
