import type { ITrackerParser } from "./base";
import type { InterceptedRequest, ParsedEvent } from "../types";
import { safeJsonParse, createEvent } from "./utils";

export const rudderstackParser: ITrackerParser = {
  type: "rudderstack",
  name: "RudderStack",

  matchesUrl(url: string): boolean {
    return url.includes("dataplane.rudderstack.com") || url.includes("rudderstack.com/v1/");
  },

  parse(request: InterceptedRequest): ParsedEvent | null {
    if (!request.body) return null;

    const data = safeJsonParse(request.body) as Record<string, unknown> | null;
    if (!data) return null;

    const callType = (data.type as string) || "track";
    const eventName = (data.event as string) || callType;

    const parameters: Record<string, string> = {};
    if (data.properties && typeof data.properties === "object") {
      for (const [k, v] of Object.entries(data.properties as Record<string, unknown>)) {
        parameters[k] = String(v);
      }
    }
    if (data.userId) parameters.userId = String(data.userId);
    if (data.anonymousId) parameters.anonymousId = String(data.anonymousId);

    return createEvent(
      request,
      "rudderstack",
      eventName,
      callType,
      parameters,
      { trackingId: (data.writeKey as string) || undefined },
      data
    );
  },
};
