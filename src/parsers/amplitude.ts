import type { ITrackerParser } from "./base";
import type { InterceptedRequest, ParsedEvent } from "../types";
import { safeJsonParse, parseFormBody, createEvent } from "./utils";

export const amplitudeParser: ITrackerParser = {
  type: "amplitude",
  name: "Amplitude",

  matchesUrl(url: string): boolean {
    return (
      url.includes("api.amplitude.com") ||
      url.includes("api2.amplitude.com") ||
      url.includes("api.eu.amplitude.com")
    );
  },

  parse(request: InterceptedRequest): ParsedEvent | null {
    if (!request.body) return null;

    let data: Record<string, unknown> | null = null;

    // v2 API: JSON body. Legacy v1: form-encoded with `event` field containing JSON
    if (request.body.startsWith("{")) {
      data = safeJsonParse(request.body) as Record<string, unknown> | null;
    } else {
      // Legacy form-encoded: api_key=...&event=<url-encoded JSON>
      const formParams = parseFormBody(request.body);
      if (formParams.event) {
        const eventJson = safeJsonParse(formParams.event);
        if (eventJson) {
          data = { api_key: formParams.api_key, events: [eventJson] };
        }
      } else if (formParams.e) {
        // Another legacy format
        data = safeJsonParse(formParams.e) as Record<string, unknown> | null;
      }
    }

    if (!data) return null;

    const apiKey = (data.api_key as string) || "";
    const events = (data.events as Array<Record<string, unknown>>) || [];

    if (events.length === 0) return null;

    const event = events[0];
    const eventType = (event.event_type as string) || "unknown";

    const parameters: Record<string, string> = {};

    // Event properties
    if (event.event_properties && typeof event.event_properties === "object") {
      for (const [k, v] of Object.entries(event.event_properties as Record<string, unknown>)) {
        parameters[k] = typeof v === "object" ? JSON.stringify(v) : String(v);
      }
    }

    // Key identification fields
    if (event.user_id) parameters.user_id = String(event.user_id);
    if (event.device_id) parameters.device_id = String(event.device_id);
    if (event.session_id) parameters.session_id = String(event.session_id);
    if (event.platform) parameters.platform = String(event.platform);
    if (event.os_name) parameters.os = `${event.os_name} ${event.os_version || ""}`.trim();
    if (event.app_version) parameters.app_version = String(event.app_version);
    if (event.library) parameters.library = String(event.library);

    return createEvent(
      request,
      "amplitude",
      eventType,
      "event",
      parameters,
      { trackingId: apiKey },
      events.length > 1 ? data : event
    );
  },
};
