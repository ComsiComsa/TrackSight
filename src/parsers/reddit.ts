import type { ITrackerParser } from "./base";
import type { InterceptedRequest, ParsedEvent } from "../types";
import { parseQueryParams, parseFormBody, safeJsonParse, createEvent } from "./utils";

export const redditParser: ITrackerParser = {
  type: "reddit",
  name: "Reddit Pixel",

  matchesUrl(url: string): boolean {
    return url.includes("alb.reddit.com") || url.includes("rp.reddit.com");
  },

  parse(request: InterceptedRequest): ParsedEvent | null {
    let params = parseQueryParams(request.url);
    if (request.body) {
      const json = safeJsonParse(request.body) as Record<string, unknown> | null;
      if (json && typeof json === "object") {
        for (const [key, value] of Object.entries(json)) {
          params[key] = String(value);
        }
      } else {
        params = { ...params, ...parseFormBody(request.body) };
      }
    }

    const eventName = params.event || params.eventType || params.type || "PageVisit";
    const advertiserId = params.advertiser_id || params.id || params.a || "";

    const parameters: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      parameters[key] = value;
    }

    return createEvent(
      request,
      "reddit",
      eventName,
      eventName,
      parameters,
      { trackingId: advertiserId },
      params
    );
  },
};
