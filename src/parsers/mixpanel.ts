import type { ITrackerParser } from "./base";
import type { InterceptedRequest, ParsedEvent } from "../types";
import { parseQueryParams, decodeBase64, safeJsonParse, createEvent } from "./utils";

export const mixpanelParser: ITrackerParser = {
  type: "mixpanel",
  name: "Mixpanel",

  matchesUrl(url: string): boolean {
    return (
      url.includes("api-js.mixpanel.com/track") ||
      url.includes("api-js.mixpanel.com/engage") ||
      url.includes("api.mixpanel.com/track") ||
      url.includes("api.mixpanel.com/engage")
    );
  },

  parse(request: InterceptedRequest): ParsedEvent | null {
    const params = parseQueryParams(request.url);

    // Mixpanel encodes event data as base64 in the "data" param
    const dataParam = params.data;
    if (!dataParam) return null;

    const decoded = decodeBase64(dataParam);
    const data = safeJsonParse(decoded) as Record<string, unknown> | null;
    if (!data) return null;

    const eventName = (data.event as string) || "unknown";
    const properties = (data.properties as Record<string, unknown>) || {};

    const parameters: Record<string, string> = {};
    for (const [k, v] of Object.entries(properties)) {
      parameters[k] = String(v);
    }

    const token = (properties.token as string) || "";

    return createEvent(
      request,
      "mixpanel",
      eventName,
      "event",
      parameters,
      { trackingId: token },
      data
    );
  },
};
