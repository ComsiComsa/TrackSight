import type { ITrackerParser } from "./base";
import type { InterceptedRequest, ParsedEvent } from "../types";
import { safeJsonParse, createEvent } from "./utils";

export const amplitudeParser: ITrackerParser = {
  type: "amplitude",
  name: "Amplitude",

  matchesUrl(url: string): boolean {
    return (
      url.includes("api.amplitude.com") ||
      url.includes("api2.amplitude.com") ||
      url.includes("amplitude.com/2/httpapi")
    );
  },

  parse(request: InterceptedRequest): ParsedEvent | null {
    if (!request.body) return null;

    const data = safeJsonParse(request.body) as Record<string, unknown> | null;
    if (!data) return null;

    const apiKey = (data.api_key as string) || "";
    const events = (data.events as Array<Record<string, unknown>>) || [];

    // Return first event (batch support could be added later)
    if (events.length === 0) return null;

    const event = events[0];
    const eventType = (event.event_type as string) || "unknown";

    const parameters: Record<string, string> = {};
    if (event.event_properties && typeof event.event_properties === "object") {
      for (const [k, v] of Object.entries(event.event_properties as Record<string, unknown>)) {
        parameters[k] = String(v);
      }
    }
    if (event.user_id) parameters.user_id = String(event.user_id);
    if (event.device_id) parameters.device_id = String(event.device_id);

    return createEvent(
      request,
      "amplitude",
      eventType,
      "event",
      parameters,
      { trackingId: apiKey },
      data
    );
  },
};
