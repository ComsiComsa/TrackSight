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
  | "unknown";

export const TRACKER_COLORS: Record<TrackerType, string> = {
  ga4: "#E37400",
  "google-ua": "#E37400",
  gtm: "#4285F4",
  facebook: "#1877F2",
  segment: "#52BD94",
  amplitude: "#1E61F0",
  mixpanel: "#7856FF",
  hotjar: "#FD3A5C",
  yandex: "#FC3F1D",
  tiktok: "#000000",
  posthog: "#1D4AFF",
  pinterest: "#E60023",
  linkedin: "#0A66C2",
  heap: "#FF6B35",
  plausible: "#5850EC",
  rudderstack: "#1E88E5",
  snap: "#FFFC00",
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
  unknown: "Unknown",
};
