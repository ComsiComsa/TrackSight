export interface Settings {
  theme: "light" | "dark" | "system";
  language: "en" | "ru";
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

export const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    "app.title": "TrackSight",
    "tab.events": "Events",
    "tab.settings": "Settings",
    "events.recording": "Recording",
    "events.paused": "Paused",
    "events.clear": "Clear",
    "events.export": "Export",
    "events.search": "Search events...",
    "events.empty": "No analytics events captured yet.",
    "events.empty.hint": "Navigate to a page with analytics trackers.",
    "events.count": "events",
    "settings.theme": "Theme",
    "settings.theme.light": "Light",
    "settings.theme.dark": "Dark",
    "settings.theme.system": "System",
    "settings.language": "Language",
    "settings.custom_trackers": "Custom Trackers",
    "settings.custom_trackers.hint": "Track requests to specific URLs",
    "settings.custom_trackers.add": "Add Tracker",
    "settings.custom_trackers.name": "Name",
    "settings.custom_trackers.url_pattern": "URL Pattern",
    "settings.custom_trackers.method": "Method",
    "settings.keyword_rules": "Keyword Rules",
    "settings.keyword_rules.hint": "Capture any request matching keywords in URL or body",
    "settings.keyword_rules.add": "Add Rule",
    "settings.keyword_rules.label": "Label",
    "settings.keyword_rules.keywords": "Keywords (comma-separated)",
    "settings.keyword_rules.match_in": "Match in",
    "settings.keyword_rules.match_url": "URL",
    "settings.keyword_rules.match_body": "Body",
    "settings.keyword_rules.match_both": "Both",
    "settings.about": "About",
    "settings.about.version": "Version",
    "settings.about.description": "Intercept and inspect analytics events from popular trackers in real-time.",
    "detail.back": "Back",
    "detail.parsed": "Parsed",
    "detail.raw": "Raw",
    "detail.event_type": "Event Type",
    "detail.time": "Time",
    "detail.metadata": "Metadata",
    "detail.parameters": "Parameters",
    "detail.payload": "Full Payload",
    "detail.raw_url": "Raw URL",
  },
  ru: {
    "app.title": "TrackSight",
    "tab.events": "События",
    "tab.settings": "Настройки",
    "events.recording": "Запись",
    "events.paused": "Пауза",
    "events.clear": "Очистить",
    "events.export": "Экспорт",
    "events.search": "Поиск событий...",
    "events.empty": "Событий аналитики пока нет.",
    "events.empty.hint": "Перейдите на страницу с аналитическими трекерами.",
    "events.count": "событий",
    "settings.theme": "Тема",
    "settings.theme.light": "Светлая",
    "settings.theme.dark": "Тёмная",
    "settings.theme.system": "Системная",
    "settings.language": "Язык",
    "settings.custom_trackers": "Кастомные трекеры",
    "settings.custom_trackers.hint": "Отслеживание запросов к конкретным URL",
    "settings.custom_trackers.add": "Добавить трекер",
    "settings.custom_trackers.name": "Название",
    "settings.custom_trackers.url_pattern": "URL паттерн",
    "settings.custom_trackers.method": "Метод",
    "settings.keyword_rules": "Правила по ключевым словам",
    "settings.keyword_rules.hint": "Захват любых запросов по совпадению ключевых слов в URL или теле",
    "settings.keyword_rules.add": "Добавить правило",
    "settings.keyword_rules.label": "Метка",
    "settings.keyword_rules.keywords": "Ключевые слова (через запятую)",
    "settings.keyword_rules.match_in": "Искать в",
    "settings.keyword_rules.match_url": "URL",
    "settings.keyword_rules.match_body": "Теле",
    "settings.keyword_rules.match_both": "Везде",
    "settings.about": "О расширении",
    "settings.about.version": "Версия",
    "settings.about.description": "Перехват и просмотр событий аналитики популярных трекеров в реальном времени.",
    "detail.back": "Назад",
    "detail.parsed": "Разобрано",
    "detail.raw": "Исходный",
    "detail.event_type": "Тип события",
    "detail.time": "Время",
    "detail.metadata": "Метаданные",
    "detail.parameters": "Параметры",
    "detail.payload": "Полные данные",
    "detail.raw_url": "Исходный URL",
  },
};
