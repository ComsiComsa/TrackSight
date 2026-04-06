import type { ITrackerParser } from "./base";
import type { InterceptedRequest, ParsedEvent } from "../types";
import { safeJsonParse, createEvent } from "./utils";

export const segmentParser: ITrackerParser = {
  type: "segment",
  name: "Segment",

  matchesUrl(url: string): boolean {
    return (
      url.includes("api.segment.io/v1/") ||
      url.includes("api.segment.com/v1/") ||
      url.includes("cdn.segment.com/v1/")
    );
  },

  parse(request: InterceptedRequest): ParsedEvent | null {
    if (!request.body) return null;

    const data = safeJsonParse(request.body) as Record<string, unknown> | null;
    if (!data) return null;

    const writeKey = (data.writeKey as string) || "";

    // Handle batch endpoint (/v1/b)
    if (data.batch && Array.isArray(data.batch)) {
      const firstEvent = (data.batch as Array<Record<string, unknown>>)[0];
      if (!firstEvent) return null;
      return parseSegmentEvent(request, firstEvent, writeKey, data);
    }

    // Single event
    return parseSegmentEvent(request, data, writeKey, data);
  },
};

function parseSegmentEvent(
  request: InterceptedRequest,
  event: Record<string, unknown>,
  writeKey: string,
  fullPayload: unknown
): ParsedEvent {
  const callType = (event.type as string) || "track";
  const eventName = (event.event as string) || (event.name as string) || callType;

  const parameters: Record<string, string> = {};

  // Properties (track/page)
  const props = (event.properties as Record<string, unknown>) || {};
  for (const [k, v] of Object.entries(props)) {
    parameters[k] = typeof v === "object" ? JSON.stringify(v) : String(v);
  }

  // Traits (identify/group)
  const traits = (event.traits as Record<string, unknown>) || {};
  for (const [k, v] of Object.entries(traits)) {
    parameters[`trait.${k}`] = typeof v === "object" ? JSON.stringify(v) : String(v);
  }

  if (event.userId) parameters.userId = String(event.userId);
  if (event.anonymousId) parameters.anonymousId = String(event.anonymousId);
  if (event.groupId) parameters.groupId = String(event.groupId);

  // Context page info
  const context = event.context as Record<string, unknown> | undefined;
  if (context?.page && typeof context.page === "object") {
    const page = context.page as Record<string, unknown>;
    if (page.url) parameters["page.url"] = String(page.url);
    if (page.title) parameters["page.title"] = String(page.title);
  }

  return createEvent(
    request,
    "segment",
    eventName,
    callType,
    parameters,
    { trackingId: writeKey },
    fullPayload
  );
}
