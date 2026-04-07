export type Language = "en";

export interface Settings {
  theme: "light" | "dark" | "system";
  language: Language;
  customTrackers: CustomTracker[];
  keywordRules: KeywordRule[];
}

export interface CustomTracker {
  id: string;
  name: string;
  urlPattern: string;
  method: "GET" | "POST" | "ANY";
  enabled: boolean;
}

export interface KeywordRule {
  id: string;
  label: string;
  keywords: string[];       // any of these keywords triggers a match
  matchIn: "url" | "body" | "both";
  enabled: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  language: "en",
  customTrackers: [],
  keywordRules: [],
};

// Re-export translations from i18n module
export { TRANSLATIONS } from "../i18n";
