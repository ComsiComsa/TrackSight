import type { ITrackerParser } from "./base";
import type { InterceptedRequest, ParsedEvent } from "../types";
import { parseQueryParams, safeJsonParse, createEvent } from "./utils";

export const facebookParser: ITrackerParser = {
  type: "facebook",
  name: "Facebook Pixel",

  matchesUrl(url: string): boolean {
    return url.includes("facebook.com/tr") || url.includes("facebook.net/tr");
  },

  parse(request: InterceptedRequest): ParsedEvent | null {
    const params = parseQueryParams(request.url);
    const eventName = params.ev || "Unknown";
    const pixelId = params.id || "";

    // Parse custom data if present
    const parameters: Record<string, string> = { ...params };
    if (params.cd) {
      const customData = safeJsonParse(params.cd);
      if (customData && typeof customData === "object") {
        for (const [k, v] of Object.entries(customData as Record<string, unknown>)) {
          parameters[`cd.${k}`] = String(v);
        }
      }
    }

    return createEvent(
      request,
      "facebook",
      eventName,
      eventName,
      parameters,
      { trackingId: pixelId },
      params
    );
  },
};
