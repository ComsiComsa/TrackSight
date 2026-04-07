<script lang="ts">
  import type { Settings, CustomTracker, KeywordRule } from "../../types";

  interface Props {
    settings: Settings;
    t: (key: string) => string;
    onSave: (settings: Settings) => void;
  }

  let { settings, t, onSave }: Props = $props();

  // Custom tracker form
  let showAddTracker = $state(false);
  let newTrackerName = $state("");
  let newTrackerUrl = $state("");
  let newTrackerMethod = $state<"GET" | "POST" | "ANY">("ANY");

  // Keyword rule form
  let showAddKeyword = $state(false);
  let newKeywordLabel = $state("");
  let newKeywordWords = $state("");
  let newKeywordMatch = $state<"url" | "body" | "both">("both");

  function setTheme(theme: Settings["theme"]) {
    onSave({ ...settings, theme });
  }


  // --- Custom trackers ---
  function addTracker() {
    if (!newTrackerName.trim() || !newTrackerUrl.trim()) return;
    const tracker: CustomTracker = {
      id: crypto.randomUUID(),
      name: newTrackerName.trim(),
      urlPattern: newTrackerUrl.trim(),
      method: newTrackerMethod,
      enabled: true,
    };
    onSave({ ...settings, customTrackers: [...(settings.customTrackers ?? []), tracker] });
    newTrackerName = "";
    newTrackerUrl = "";
    newTrackerMethod = "ANY";
    showAddTracker = false;
  }

  function removeTracker(id: string) {
    onSave({ ...settings, customTrackers: (settings.customTrackers ?? []).filter((t) => t.id !== id) });
  }

  function toggleTracker(id: string) {
    onSave({
      ...settings,
      customTrackers: (settings.customTrackers ?? []).map((t) =>
        t.id === id ? { ...t, enabled: !t.enabled } : t
      ),
    });
  }

  // --- Keyword rules ---
  function addKeywordRule() {
    if (!newKeywordLabel.trim() || !newKeywordWords.trim()) return;
    const rule: KeywordRule = {
      id: crypto.randomUUID(),
      label: newKeywordLabel.trim(),
      keywords: newKeywordWords.split(",").map((k) => k.trim()).filter(Boolean),
      matchIn: newKeywordMatch,
      enabled: true,
    };
    onSave({ ...settings, keywordRules: [...(settings.keywordRules ?? []), rule] });
    newKeywordLabel = "";
    newKeywordWords = "";
    newKeywordMatch = "both";
    showAddKeyword = false;
  }

  function removeKeywordRule(id: string) {
    onSave({ ...settings, keywordRules: (settings.keywordRules ?? []).filter((r) => r.id !== id) });
  }

  function toggleKeywordRule(id: string) {
    onSave({
      ...settings,
      keywordRules: (settings.keywordRules ?? []).map((r) =>
        r.id === id ? { ...r, enabled: !r.enabled } : r
      ),
    });
  }
</script>

<div class="flex-1 overflow-auto p-3 space-y-4">
  <!-- Theme -->
  <div>
    <div class="text-xs font-medium text-gray-700 mb-1.5">{t("settings.theme")}</div>
    <div class="flex gap-1.5">
      {#each ["light", "dark", "system"] as theme}
        <button
          onclick={() => setTheme(theme as Settings["theme"])}
          class="flex-1 px-2 py-1.5 text-xs rounded-lg border transition-colors {settings.theme === theme ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}"
        >{t(`settings.theme.${theme}`)}</button>
      {/each}
    </div>
  </div>

  <!-- Keyword Rules -->
  <div>
    <div class="flex items-center justify-between mb-1.5">
      <div>
        <div class="text-xs font-medium text-gray-700">{t("settings.keyword_rules")}</div>
        <div class="text-[10px] text-gray-400">{t("settings.keyword_rules.hint")}</div>
      </div>
      <button
        onclick={() => (showAddKeyword = !showAddKeyword)}
        class="px-2 py-1 text-[10px] rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
      >+ {t("settings.keyword_rules.add")}</button>
    </div>

    {#if showAddKeyword}
      <div class="bg-gray-50 rounded-lg border border-gray-200 p-2.5 mb-2 space-y-2">
        <input
          type="text"
          placeholder={t("settings.keyword_rules.label") + " (e.g. Backend Events)"}
          bind:value={newKeywordLabel}
          class="w-full px-2 py-1 text-xs rounded border border-gray-200 focus:outline-none focus:border-indigo-400"
        />
        <input
          type="text"
          placeholder={t("settings.keyword_rules.keywords") + " (e.g. /track, /event, analytics)"}
          bind:value={newKeywordWords}
          class="w-full px-2 py-1 text-xs rounded border border-gray-200 focus:outline-none focus:border-indigo-400 font-mono"
        />
        <div class="flex gap-1.5 items-center">
          <span class="text-[10px] text-gray-500">{t("settings.keyword_rules.match_in")}:</span>
          {#each [["url", "settings.keyword_rules.match_url"], ["body", "settings.keyword_rules.match_body"], ["both", "settings.keyword_rules.match_both"]] as [val, label]}
            <button
              onclick={() => (newKeywordMatch = val as "url" | "body" | "both")}
              class="px-2 py-0.5 text-[10px] rounded border transition-colors {newKeywordMatch === val ? 'border-indigo-400 bg-indigo-50 text-indigo-600' : 'border-gray-200 text-gray-500'}"
            >{t(label)}</button>
          {/each}
          <div class="flex-1"></div>
          <button onclick={() => (showAddKeyword = false)} class="px-2 py-1 text-xs text-gray-500 hover:text-gray-700">Cancel</button>
          <button onclick={addKeywordRule} class="px-3 py-1 text-xs rounded bg-indigo-600 text-white hover:bg-indigo-500">Add</button>
        </div>
      </div>
    {/if}

    {#if (settings.keywordRules ?? []).length > 0}
      <div class="space-y-1">
        {#each settings.keywordRules ?? [] as rule}
          <div class="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gray-50 border border-gray-200">
            <button
              onclick={() => toggleKeywordRule(rule.id)}
              class="w-3 h-3 rounded-sm border shrink-0 {rule.enabled ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}"
            >
              {#if rule.enabled}
                <svg class="w-3 h-3 text-white" viewBox="0 0 12 12"><path d="M3 6l2 2 4-4" stroke="currentColor" stroke-width="2" fill="none"/></svg>
              {/if}
            </button>
            <div class="flex-1 min-w-0">
              <div class="text-xs font-medium text-gray-700 truncate">{rule.label}</div>
              <div class="text-[10px] text-gray-400 font-mono truncate">
                {rule.matchIn}: {rule.keywords.join(", ")}
              </div>
            </div>
            <button onclick={() => removeKeywordRule(rule.id)} class="text-gray-400 hover:text-red-500 text-sm shrink-0">&times;</button>
          </div>
        {/each}
      </div>
    {:else if !showAddKeyword}
      <div class="text-[10px] text-gray-400 text-center py-2">No keyword rules configured</div>
    {/if}
  </div>

  <!-- Custom Trackers -->
  <div>
    <div class="flex items-center justify-between mb-1.5">
      <div>
        <div class="text-xs font-medium text-gray-700">{t("settings.custom_trackers")}</div>
        <div class="text-[10px] text-gray-400">{t("settings.custom_trackers.hint")}</div>
      </div>
      <button
        onclick={() => (showAddTracker = !showAddTracker)}
        class="px-2 py-1 text-[10px] rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
      >+ {t("settings.custom_trackers.add")}</button>
    </div>

    {#if showAddTracker}
      <div class="bg-gray-50 rounded-lg border border-gray-200 p-2.5 mb-2 space-y-2">
        <input type="text" placeholder={t("settings.custom_trackers.name")} bind:value={newTrackerName}
          class="w-full px-2 py-1 text-xs rounded border border-gray-200 focus:outline-none focus:border-indigo-400" />
        <input type="text" placeholder={t("settings.custom_trackers.url_pattern") + " (e.g. api.example.com/events)"} bind:value={newTrackerUrl}
          class="w-full px-2 py-1 text-xs rounded border border-gray-200 focus:outline-none focus:border-indigo-400 font-mono" />
        <div class="flex gap-1.5 items-center">
          <select bind:value={newTrackerMethod}
            class="px-2 py-1 text-xs rounded border border-gray-200 focus:outline-none focus:border-indigo-400">
            <option value="ANY">ANY</option>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
          </select>
          <div class="flex-1"></div>
          <button onclick={() => (showAddTracker = false)} class="px-2 py-1 text-xs text-gray-500 hover:text-gray-700">Cancel</button>
          <button onclick={addTracker} class="px-3 py-1 text-xs rounded bg-indigo-600 text-white hover:bg-indigo-500">Add</button>
        </div>
      </div>
    {/if}

    {#if (settings.customTrackers ?? []).length > 0}
      <div class="space-y-1">
        {#each settings.customTrackers ?? [] as tracker}
          <div class="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gray-50 border border-gray-200">
            <button
              onclick={() => toggleTracker(tracker.id)}
              class="w-3 h-3 rounded-sm border shrink-0 {tracker.enabled ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}"
            >
              {#if tracker.enabled}
                <svg class="w-3 h-3 text-white" viewBox="0 0 12 12"><path d="M3 6l2 2 4-4" stroke="currentColor" stroke-width="2" fill="none"/></svg>
              {/if}
            </button>
            <div class="flex-1 min-w-0">
              <div class="text-xs font-medium text-gray-700 truncate">{tracker.name}</div>
              <div class="text-[10px] text-gray-400 font-mono truncate">{tracker.method} {tracker.urlPattern}</div>
            </div>
            <button onclick={() => removeTracker(tracker.id)} class="text-gray-400 hover:text-red-500 text-sm shrink-0">&times;</button>
          </div>
        {/each}
      </div>
    {:else if !showAddTracker}
      <div class="text-[10px] text-gray-400 text-center py-2">No custom trackers configured</div>
    {/if}
  </div>

  <!-- About -->
  <div class="border-t border-gray-200 pt-3">
    <div class="text-xs font-medium text-gray-700 mb-1">{t("settings.about")}</div>
    <div class="text-[10px] text-gray-500 space-y-0.5">
      <p><strong>TrackSight</strong> {t("settings.about.version")} 0.1.0</p>
      <p>{t("settings.about.description")}</p>
      <p class="pt-1 text-gray-400">17 built-in trackers + custom URL patterns + keyword rules</p>
    </div>
  </div>
</div>
