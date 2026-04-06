import type { ITrackerParser } from "./base";
import type { InterceptedRequest, ParsedEvent } from "../types";

// Tier 1 parsers
import { googleGA4Parser } from "./google-ga4";
import { googleUAParser } from "./google-ua";
import { googleGTMParser } from "./google-gtm";
import { facebookParser } from "./facebook";
import { segmentParser } from "./segment";
import { amplitudeParser } from "./amplitude";
import { mixpanelParser } from "./mixpanel";

// Tier 2 parsers
import { hotjarParser } from "./hotjar";
import { yandexParser } from "./yandex";
import { tiktokParser } from "./tiktok";
import { posthogParser } from "./posthog";
import { pinterestParser } from "./pinterest";
import { linkedinParser } from "./linkedin";
import { heapParser } from "./heap";
import { plausibleParser } from "./plausible";
import { rudderstackParser } from "./rudderstack";
import { snapParser } from "./snap";

/**
 * Ordered list of parsers. GA4 before UA to avoid false matches
 * (both match google-analytics.com, but GA4 uses /g/collect).
 */
const parsers: ITrackerParser[] = [
  // Tier 1
  googleGA4Parser,
  googleUAParser,
  googleGTMParser,
  facebookParser,
  segmentParser,
  amplitudeParser,
  mixpanelParser,
  // Tier 2
  hotjarParser,
  yandexParser,
  tiktokParser,
  posthogParser,
  pinterestParser,
  linkedinParser,
  heapParser,
  plausibleParser,
  rudderstackParser,
  snapParser,
];

/**
 * Try to parse an intercepted request through all registered parsers.
 * Returns the first successful match, or null if no parser matches.
 */
export function parseRequest(request: InterceptedRequest): ParsedEvent | null {
  for (const parser of parsers) {
    if (parser.matchesUrl(request.url)) {
      try {
        const result = parser.parse(request);
        if (result) return result;
      } catch {
        // Skip failed parsers
      }
    }
  }
  return null;
}
