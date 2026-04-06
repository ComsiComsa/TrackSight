import type { ITrackerParser } from "./base";
import type { InterceptedRequest, ParsedEvent } from "../types";
import { parseQueryParams, safeJsonParse, createEvent } from "./utils";

export const tiktokParser: ITrackerParser = {
  type: "tiktok",
  name: "TikTok Pixel",

  matchesUrl(url: string): boolean {
    return url.includes("analytics.tiktok.com") && (url.includes("/pixel/") || url.includes("/api/v2/pixel"));
  },

  parse(request: InterceptedRequest): ParsedEvent | null {
    const params = parseQueryParams(request.url);

    let eventName = params.event || "PageVisit";
    let parameters: Record<string, string> = { ...params };

    if (request.body) {
      const data = safeJsonParse(request.body) as Record<string, unknown> | null;
      if (data) {
        eventName = (data.event as string) || eventName;
        if (data.properties && typeof data.properties === "object") {
          for (const [k, v] of Object.entries(data.properties as Record<string, unknown>)) {
            parameters[k] = String(v);
          }
        }
      }
    }

    return createEvent(
      request,
      "tiktok",
      eventName,
      "event",
      parameters,
      { trackingId: params.sdkid || params.pixel_code || undefined }
    );
  },
};
