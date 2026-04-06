import type { ITrackerParser } from "./base";
import type { InterceptedRequest, ParsedEvent } from "../types";
import {
  matchCustomTracker, parseCustomRequest,
  matchKeywordRule, parseKeywordMatch,
} from "./custom";

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

const parsers: ITrackerParser[] = [
  googleGA4Parser,
  googleUAParser,
  googleGTMParser,
  facebookParser,
  segmentParser,
  amplitudeParser,
  mixpanelParser,
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

export function parseRequest(request: InterceptedRequest): ParsedEvent | null {
  // 1. Try built-in parsers
  for (const parser of parsers) {
    if (parser.matchesUrl(request.url)) {
      try {
        const result = parser.parse(request);
        if (result) return result;
      } catch {}
    }
  }

  // 2. Try custom tracker URL patterns
  const customTracker = matchCustomTracker(request.url, request.method);
  if (customTracker) {
    try {
      return parseCustomRequest(request, customTracker);
    } catch {}
  }

  // 3. Try keyword rules (matches against URL and/or body)
  const keywordRule = matchKeywordRule(request.url, request.body);
  if (keywordRule) {
    try {
      return parseKeywordMatch(request, keywordRule);
    } catch {}
  }

  return null;
}
