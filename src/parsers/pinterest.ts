import type { ITrackerParser } from "./base";
import type { InterceptedRequest, ParsedEvent } from "../types";
import { parseQueryParams, safeJsonParse, createEvent } from "./utils";

export const pinterestParser: ITrackerParser = {
  type: "pinterest",
  name: "Pinterest Tag",

  matchesUrl(url: string): boolean {
    return url.includes("ct.pinterest.com");
  },

  parse(request: InterceptedRequest): ParsedEvent | null {
    const params = parseQueryParams(request.url);
    const eventName = params.event || "pagevisit";
    const tagId = params.tid || "";

    const parameters: Record<string, string> = {};
    if (params.event) parameters.event = params.event;
    if (params.tid) parameters.tag_id = params.tid;

    // Parse ed (event data) — URL-encoded JSON
    if (params.ed) {
      const eventData = safeJsonParse(params.ed) as Record<string, unknown> | null;
      if (eventData) {
        for (const [k, v] of Object.entries(eventData)) {
          parameters[k] = typeof v === "object" ? JSON.stringify(v) : String(v);
        }
      }
    }

    // Parse pd (user data for enhanced match) — URL-encoded JSON
    if (params.pd) {
      const userData = safeJsonParse(params.pd) as Record<string, unknown> | null;
      if (userData) {
        for (const [k, v] of Object.entries(userData)) {
          if (v) parameters[`user.${k}`] = String(v).slice(0, 12) + "...";
        }
      }
    }

    return createEvent(
      request,
      "pinterest",
      eventName,
      "event",
      parameters,
      { trackingId: tagId },
      params
    );
  },
};
