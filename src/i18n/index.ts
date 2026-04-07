import en from "./en";

// To add a new language:
// 1. Create a new file (e.g. src/i18n/fr.ts) with the same keys as en.ts
// 2. Import and add it to the TRANSLATIONS object below
// 3. Add the locale code to the Language type in src/types/settings.ts

export const TRANSLATIONS: Record<string, Record<string, string>> = {
  en,
};
