import type { ITrackerParser } from "./base";
import type { InterceptedRequest, ParsedEvent } from "../types";
import { parseQueryParams, parseFormBody, createEvent } from "./utils";

export const twitterParser: ITrackerParser = {
  type: "twitter",
  name: "Twitter/X Pixel",

  matchesUrl(url: string): boolean {
    return (
      url.includes("analytics.twitter.com") ||
      url.includes("t.co/i/adsct") ||
      url.includes("ads-api.twitter.com")
    );
  },

  parse(request: InterceptedRequest): ParsedEvent | null {
    let params = parseQueryParams(request.url);
    if (request.body) {
      params = { ...params, ...parseFormBody(request.body) };
    }

    const eventName = params.event || params.txn_id || params.type || "PageView";
    const pixelId = params.p_id || params.pid || "";

    const parameters: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      parameters[key] = value;
    }

    return createEvent(
      request,
      "twitter",
      eventName,
      eventName,
      parameters,
      { trackingId: pixelId },
      params
    );
  },
};
