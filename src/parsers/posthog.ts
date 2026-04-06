import type { ITrackerParser } from "./base";
import type { InterceptedRequest, ParsedEvent } from "../types";
import { safeJsonParse, parseFormBody, decodeBase64, createEvent } from "./utils";

export const posthogParser: ITrackerParser = {
  type: "posthog",
  name: "PostHog",

  matchesUrl(url: string): boolean {
    // PostHog uses /e/ endpoint. Hosts: us.i.posthog.com, eu.i.posthog.com, app.posthog.com, or self-hosted
    return (
      (url.includes("posthog.com/e") || url.includes("posthog.com/e/")) &&
      !url.includes("posthog.com/elements") // avoid false matches
    );
  },

  parse(request: InterceptedRequest): ParsedEvent | null {
    if (!request.body) return null;

    let data: unknown = null;

    // PostHog can send: raw JSON, base64 form-encoded (data=<b64>), or gzip (binary, can't parse)
    const contentLooksLikeForm = request.body.startsWith("data=");
    if (contentLooksLikeForm) {
      const formParams = parseFormBody(request.body);
      if (formParams.data) {
        const decoded = decodeBase64(formParams.data);
        data = safeJsonParse(decoded);
      }
    } else {
      data = safeJsonParse(request.body);
    }

    if (!data) return null;

    // Could be single event or batched array
    const events = Array.isArray(data) ? data : [data];
    if (events.length === 0) return null;

    const event = events[0] as Record<string, unknown>;
    const eventName = (event.event as string) || "$pageview";
    const properties = (event.properties as Record<string, unknown>) || {};

    const parameters: Record<string, string> = {};
    for (const [k, v] of Object.entries(properties)) {
      if (k.startsWith("$")) {
        // Keep $ prefix for auto-captured properties
        parameters[k] = typeof v === "object" ? JSON.stringify(v) : String(v);
      } else {
        parameters[k] = typeof v === "object" ? JSON.stringify(v) : String(v);
      }
    }

    const token = (event.token as string) || (properties.$token as string) || "";

    return createEvent(
      request,
      "posthog",
      eventName,
      "event",
      parameters,
      { trackingId: token },
      events.length > 1 ? events : event
    );
  },
};
