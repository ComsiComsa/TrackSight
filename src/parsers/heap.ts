import type { ITrackerParser } from "./base";
import type { InterceptedRequest, ParsedEvent } from "../types";
import { safeJsonParse, createEvent } from "./utils";

export const heapParser: ITrackerParser = {
  type: "heap",
  name: "Heap",

  matchesUrl(url: string): boolean {
    return url.includes("heapanalytics.com/h") || url.includes("heap-api.com/h");
  },

  parse(request: InterceptedRequest): ParsedEvent | null {
    if (!request.body) return null;

    const data = safeJsonParse(request.body) as Record<string, unknown> | null;
    if (!data) return null;

    const eventName = (data.t as string) || (data.event as string) || "track";

    const parameters: Record<string, string> = {};
    for (const [k, v] of Object.entries(data)) {
      if (typeof v !== "object") {
        parameters[k] = String(v);
      }
    }

    return createEvent(
      request,
      "heap",
      eventName,
      "event",
      parameters,
      { trackingId: (data.a as string) || (data.appId as string) || undefined },
      data
    );
  },
};
