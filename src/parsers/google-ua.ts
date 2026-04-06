import type { ITrackerParser } from "./base";
import type { InterceptedRequest, ParsedEvent } from "../types";
import { parseQueryParams, createEvent } from "./utils";

const UA_HIT_TYPES: Record<string, string> = {
  pageview: "Page View",
  event: "Event",
  transaction: "Transaction",
  item: "Item",
  social: "Social",
  exception: "Exception",
  timing: "Timing",
};

export const googleUAParser: ITrackerParser = {
  type: "google-ua",
  name: "Google Universal Analytics",

  matchesUrl(url: string): boolean {
    return (
      (url.includes("google-analytics.com/collect") ||
        url.includes("google-analytics.com/r/collect")) &&
      !url.includes("/g/collect")
    );
  },

  parse(request: InterceptedRequest): ParsedEvent | null {
    const params = parseQueryParams(request.url);
    const hitType = params.t || "pageview";
    const trackingId = params.tid || "";

    let eventName = UA_HIT_TYPES[hitType] || hitType;
    if (hitType === "event" && params.ec) {
      eventName = `${params.ec}/${params.ea || ""}`;
    }

    return createEvent(
      request,
      "google-ua",
      eventName,
      hitType,
      params,
      { trackingId },
      params
    );
  },
};
