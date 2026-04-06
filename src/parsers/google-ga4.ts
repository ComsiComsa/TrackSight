import type { ITrackerParser } from "./base";
import type { InterceptedRequest, ParsedEvent } from "../types";
import { parseQueryParams, parseFormBody, createEvent } from "./utils";

/** Human-readable names for GA4 measurement protocol params */
const GA4_PARAMS: Record<string, string> = {
  en: "event_name", dl: "document_location", dr: "document_referrer",
  dt: "document_title", ul: "user_language", sr: "screen_resolution",
  tid: "measurement_id", cid: "client_id", uid: "user_id",
  sid: "session_id", sct: "session_count", seg: "session_engaged",
  _p: "page_id", _s: "session_hits", _et: "engagement_time_ms",
  _ee: "enhanced_ecommerce", cu: "currency",
};

export const googleGA4Parser: ITrackerParser = {
  type: "ga4",
  name: "Google Analytics 4",

  matchesUrl(url: string): boolean {
    return (
      url.includes("google-analytics.com/g/collect") ||
      url.includes("analytics.google.com/g/collect")
    );
  },

  parse(request: InterceptedRequest): ParsedEvent | null {
    // Shared params are in the query string
    const queryParams = parseQueryParams(request.url);
    const measurementId = queryParams.tid || "";

    // POST body contains newline-delimited events, each line is form-encoded
    // e.g. "en=page_view&_et=500\nen=scroll&epn.percent_scrolled=90"
    const bodyLines = request.body?.split("\n").filter(Boolean) ?? [];

    // If there's a body, parse the first event line merged with query params
    // If no body, all params are in the query string (GET request fallback)
    const eventParams = bodyLines.length > 0
      ? { ...queryParams, ...parseFormBody(bodyLines[0]) }
      : queryParams;

    const eventName = eventParams.en || "page_view";

    // Build readable parameters
    const parameters: Record<string, string> = {};
    for (const [key, value] of Object.entries(eventParams)) {
      // ep.* = event parameter (string), epn.* = event parameter (numeric)
      // up.* = user property (string), upn.* = user property (numeric)
      if (key.startsWith("ep.") || key.startsWith("epn.")) {
        parameters[key.replace(/^epn?\./, "")] = value;
      } else if (key.startsWith("up.") || key.startsWith("upn.")) {
        parameters[`user.${key.replace(/^upn?\./, "")}`] = value;
      } else {
        parameters[GA4_PARAMS[key] || key] = value;
      }
    }

    return createEvent(
      request,
      "ga4",
      eventName,
      eventParams.en ? "event" : "page_view",
      parameters,
      { trackingId: measurementId },
      { queryParams, bodyEvents: bodyLines.map((l) => parseFormBody(l)) }
    );
  },
};
