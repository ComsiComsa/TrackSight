import type { ITrackerParser } from "./base";
import type { InterceptedRequest, ParsedEvent } from "../types";
import { safeJsonParse, createEvent } from "./utils";

export const posthogParser: ITrackerParser = {
  type: "posthog",
  name: "PostHog",

  matchesUrl(url: string): boolean {
    return (
      (url.includes("posthog.com/e/") || url.includes("posthog.com/e?") ||
       url.includes("/e/") || url.includes("/capture/")) &&
      (url.includes("posthog") || url.includes("i.posthog"))
    );
  },

  parse(request: InterceptedRequest): ParsedEvent | null {
    if (!request.body) return null;

    const data = safeJsonParse(request.body) as Record<string, unknown> | null;
    if (!data) return null;

    const eventName = (data.event as string) || "$pageview";
    const properties = (data.properties as Record<string, unknown>) || {};

    const parameters: Record<string, string> = {};
    for (const [k, v] of Object.entries(properties)) {
      parameters[k] = typeof v === "object" ? JSON.stringify(v) : String(v);
    }

    return createEvent(
      request,
      "posthog",
      eventName,
      "event",
      parameters,
      { trackingId: (data.api_key as string) || (properties.$token as string) || undefined },
      data
    );
  },
};
