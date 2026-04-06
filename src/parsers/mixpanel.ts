import type { ITrackerParser } from "./base";
import type { InterceptedRequest, ParsedEvent } from "../types";
import { parseQueryParams, parseFormBody, decodeBase64, safeJsonParse, createEvent } from "./utils";

export const mixpanelParser: ITrackerParser = {
  type: "mixpanel",
  name: "Mixpanel",

  matchesUrl(url: string): boolean {
    return (
      url.includes("api-js.mixpanel.com/track") ||
      url.includes("api-js.mixpanel.com/engage") ||
      url.includes("api-js.mixpanel.com/groups") ||
      url.includes("api.mixpanel.com/track") ||
      url.includes("api.mixpanel.com/engage")
    );
  },

  parse(request: InterceptedRequest): ParsedEvent | null {
    let dataStr: string | null = null;

    // Mixpanel default: POST with form-encoded body `data=<base64 JSON>`
    // Can also be JSON directly, or GET with data in query params
    if (request.body) {
      // Try form-encoded body first (default SDK behavior)
      const formParams = parseFormBody(request.body);
      if (formParams.data) {
        dataStr = decodeBase64(formParams.data);
      } else {
        // Maybe raw JSON body (api_payload_format: 'json')
        dataStr = request.body;
      }
    } else {
      // Fallback: GET with data in query params
      const params = parseQueryParams(request.url);
      if (params.data) {
        dataStr = decodeBase64(params.data);
      }
    }

    if (!dataStr) return null;

    // Could be a single event or an array (batched)
    const parsed = safeJsonParse(dataStr);
    if (!parsed) return null;

    const events = Array.isArray(parsed) ? parsed : [parsed];
    if (events.length === 0) return null;

    const data = events[0] as Record<string, unknown>;
    const eventName = (data.event as string) || "unknown";
    const properties = (data.properties as Record<string, unknown>) || {};

    const parameters: Record<string, string> = {};
    for (const [k, v] of Object.entries(properties)) {
      parameters[k] = typeof v === "object" ? JSON.stringify(v) : String(v);
    }

    const token = (properties.token as string) || "";

    return createEvent(
      request,
      "mixpanel",
      eventName,
      request.url.includes("/engage") ? "engage" : "event",
      parameters,
      { trackingId: token },
      events.length > 1 ? events : data
    );
  },
};
