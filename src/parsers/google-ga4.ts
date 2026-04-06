import type { ITrackerParser } from "./base";
import type { InterceptedRequest, ParsedEvent } from "../types";
import { parseQueryParams, parseFormBody, createEvent } from "./utils";

/** GA4 event parameter names */
const GA4_PARAMS: Record<string, string> = {
  en: "event_name",
  dl: "document_location",
  dr: "document_referrer",
  dt: "document_title",
  ul: "user_language",
  sr: "screen_resolution",
  tid: "measurement_id",
  cid: "client_id",
  uid: "user_id",
  sid: "session_id",
  sct: "session_count",
  seg: "session_engaged",
  _p: "page_id",
  _s: "session_hits",
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
    const queryParams = parseQueryParams(request.url);

    // GA4 can batch events in POST body (each line is form-encoded)
    const bodyParams = request.body ? parseFormBody(request.body) : {};
    const allParams = { ...queryParams, ...bodyParams };

    const eventName = allParams.en || "page_view";
    const measurementId = allParams.tid || "";

    // Build human-readable parameters
    const parameters: Record<string, string> = {};
    for (const [key, value] of Object.entries(allParams)) {
      const readableName = GA4_PARAMS[key] || key;
      parameters[readableName] = value;
    }

    return createEvent(
      request,
      "ga4",
      eventName,
      allParams.en ? "event" : "page_view",
      parameters,
      { trackingId: measurementId },
      allParams
    );
  },
};
