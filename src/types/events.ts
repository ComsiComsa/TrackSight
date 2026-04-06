export interface InterceptedRequest {
  url: string;
  method: string;
  body: string | null;
  timestamp: number;
  source: "fetch" | "xhr" | "beacon" | "pixel";
}

export interface ParsedEvent {
  id: string;
  tracker: TrackerType;
  trackerName: string;
  eventType: string;
  eventName: string;
  rawUrl: string;
  parameters: Record<string, string>;
  payload: unknown;
  timestamp: number;
  metadata: {
    trackingId?: string;
    [key: string]: string | undefined;
  };
}

export type TrackerType =
  | "ga4"
  | "google-ua"
  | "gtm"
  | "facebook"
  | "segment"
  | "amplitude"
  | "mixpanel"
  | "hotjar"
  | "yandex"
  | "tiktok"
  | "posthog"
  | "pinterest"
  | "linkedin"
  | "heap"
  | "plausible"
  | "rudderstack"
  | "snap"
  | "custom"
  | "unknown";

// Colors chosen for good contrast on both light and dark backgrounds
export const TRACKER_COLORS: Record<TrackerType, string> = {
  ga4: "#E37400",
  "google-ua": "#D97706",
  gtm: "#4285F4",
  facebook: "#1877F2",
  segment: "#10B981",
  amplitude: "#3B82F6",
  mixpanel: "#8B5CF6",
  hotjar: "#EF4444",
  yandex: "#EF4444",
  tiktok: "#06B6D4",
  posthog: "#3B82F6",
  pinterest: "#EF4444",
  linkedin: "#0EA5E9",
  heap: "#F97316",
  plausible: "#8B5CF6",
  rudderstack: "#3B82F6",
  snap: "#EAB308",
  custom: "#14B8A6",
  unknown: "#6B7280",
};

export const TRACKER_NAMES: Record<TrackerType, string> = {
  ga4: "GA4",
  "google-ua": "Google UA",
  gtm: "GTM",
  facebook: "Facebook Pixel",
  segment: "Segment",
  amplitude: "Amplitude",
  mixpanel: "Mixpanel",
  hotjar: "Hotjar",
  yandex: "Yandex Metrica",
  tiktok: "TikTok Pixel",
  posthog: "PostHog",
  pinterest: "Pinterest",
  linkedin: "LinkedIn",
  heap: "Heap",
  plausible: "Plausible",
  rudderstack: "RudderStack",
  snap: "Snap Pixel",
  custom: "Custom",
  unknown: "Unknown",
};
