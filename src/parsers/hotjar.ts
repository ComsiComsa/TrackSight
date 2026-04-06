import type { ITrackerParser } from "./base";
import type { InterceptedRequest, ParsedEvent } from "../types";
import { parseQueryParams, createEvent } from "./utils";

export const hotjarParser: ITrackerParser = {
  type: "hotjar",
  name: "Hotjar",

  matchesUrl(url: string): boolean {
    return url.includes("hotjar.com") && (url.includes("/api/") || url.includes("vars.hotjar.com") || url.includes("in.hotjar.com"));
  },

  parse(request: InterceptedRequest): ParsedEvent | null {
    const params = parseQueryParams(request.url);
    const siteId = params.site_id || "";
    const eventType = request.url.includes("vars.hotjar") ? "config" : "signal";

    return createEvent(
      request,
      "hotjar",
      eventType,
      eventType,
      params,
      { trackingId: siteId }
    );
  },
};
