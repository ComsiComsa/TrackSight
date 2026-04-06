import type { ITrackerParser } from "./base";
import type { InterceptedRequest, ParsedEvent } from "../types";
import { parseQueryParams, safeJsonParse, createEvent } from "./utils";

export const tiktokParser: ITrackerParser = {
  type: "tiktok",
  name: "TikTok Pixel",

  matchesUrl(url: string): boolean {
    return url.includes("analytics.tiktok.com");
  },

  parse(request: InterceptedRequest): ParsedEvent | null {
    const queryParams = parseQueryParams(request.url);
    let eventName = "unknown";
    let pixelCode = "";
    const parameters: Record<string, string> = {};
    let payload: unknown = queryParams;

    // TikTok sends JSON POST body with rich event data
    if (request.body) {
      const data = safeJsonParse(request.body) as Record<string, unknown> | null;
      if (data) {
        payload = data;
        eventName = (data.event as string) || eventName;

        // Extract pixel code from context.pixel.code
        const context = data.context as Record<string, unknown> | undefined;
        if (context) {
          const pixel = context.pixel as Record<string, unknown> | undefined;
          if (pixel?.code) pixelCode = String(pixel.code);

          // Page info
          const page = context.page as Record<string, unknown> | undefined;
          if (page?.url) parameters.url = String(page.url);
          if (page?.referrer) parameters.referrer = String(page.referrer);

          // User info
          const user = context.user as Record<string, unknown> | undefined;
          if (user?.anonymous_id) parameters.anonymous_id = String(user.anonymous_id);

          // Library
          const library = context.library as Record<string, unknown> | undefined;
          if (library?.name) parameters.library = `${library.name}@${library.version || ""}`;
        }

        if (data.event_id) parameters.event_id = String(data.event_id);
        if (data.timestamp) parameters.timestamp = String(data.timestamp);

        // Properties
        const props = data.properties as Record<string, unknown> | undefined;
        if (props && typeof props === "object") {
          for (const [k, v] of Object.entries(props)) {
            if (v !== undefined && v !== null && v !== "") {
              parameters[`prop.${k}`] = typeof v === "object" ? JSON.stringify(v) : String(v);
            }
          }
        }
      }
    }

    // Fallback to query params
    if (eventName === "unknown") {
      eventName = queryParams.ev || queryParams.event || "PageVisit";
    }
    if (!pixelCode) {
      pixelCode = queryParams.sdkid || queryParams.pixel_code || "";
    }

    return createEvent(
      request,
      "tiktok",
      eventName,
      "event",
      parameters,
      { trackingId: pixelCode },
      payload
    );
  },
};
