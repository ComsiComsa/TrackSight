import type { ITrackerParser } from "./base";
import type { InterceptedRequest, ParsedEvent } from "../types";
import { parseQueryParams, safeJsonParse, createEvent } from "./utils";

export const hotjarParser: ITrackerParser = {
  type: "hotjar",
  name: "Hotjar",

  matchesUrl(url: string): boolean {
    return url.includes("in.hotjar.com/api/") || url.includes("vars.hotjar.com");
  },

  parse(request: InterceptedRequest): ParsedEvent | null {
    // Extract site ID from URL: /sites/<site_id>/
    let siteId = "";
    const siteMatch = request.url.match(/\/sites\/(\d+)\//);
    if (siteMatch) siteId = siteMatch[1];

    // Determine event type from URL path
    let eventType = "signal";
    let eventName = "signal";
    if (request.url.includes("/visit-data")) {
      eventType = "heatmap";
      eventName = "visit_data";
    } else if (request.url.includes("/identify")) {
      eventType = "identify";
      eventName = "identify";
    } else if (request.url.includes("/feedback")) {
      eventType = "feedback";
      eventName = "feedback";
    } else if (request.url.includes("vars.hotjar")) {
      eventType = "config";
      eventName = "config_load";
    }

    const parameters: Record<string, string> = {};

    if (request.body) {
      const data = safeJsonParse(request.body) as Record<string, unknown> | null;
      if (data) {
        if (data.url) parameters.url = String(data.url);
        if (data.title) parameters.title = String(data.title);
        if (data.visitor_id) parameters.visitor_id = String(data.visitor_id);
        if (data.viewport_width) parameters.viewport = `${data.viewport_width}x${data.viewport_height}`;
        if (data.device_type) parameters.device = String(data.device_type);

        return createEvent(request, "hotjar", eventName, eventType, parameters, { trackingId: siteId }, data);
      }
    }

    const params = parseQueryParams(request.url);
    return createEvent(request, "hotjar", eventName, eventType, params, { trackingId: siteId });
  },
};
