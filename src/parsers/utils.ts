import type { TrackerType, ParsedEvent, InterceptedRequest } from "../types";
import { TRACKER_NAMES } from "../types";

/** Parse URL query parameters into a record */
export function parseQueryParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  try {
    const u = new URL(url);
    u.searchParams.forEach((v, k) => {
      params[k] = v;
    });
  } catch {}
  return params;
}

/** Parse form-encoded body (key=value&key2=value2) */
export function parseFormBody(body: string): Record<string, string> {
  const params: Record<string, string> = {};
  try {
    const sp = new URLSearchParams(body);
    sp.forEach((v, k) => {
      params[k] = v;
    });
  } catch {}
  return params;
}

/** Decode base64 string */
export function decodeBase64(str: string): string {
  try {
    return atob(str);
  } catch {
    return str;
  }
}

/** Safely parse JSON */
export function safeJsonParse(str: string): unknown {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

/** Create a ParsedEvent with defaults */
export function createEvent(
  request: InterceptedRequest,
  tracker: TrackerType,
  eventName: string,
  eventType: string,
  parameters: Record<string, string>,
  metadata: Record<string, string | undefined> = {},
  payload?: unknown
): ParsedEvent {
  return {
    id: crypto.randomUUID(),
    tracker,
    trackerName: TRACKER_NAMES[tracker],
    eventName,
    eventType,
    rawUrl: request.url,
    parameters,
    payload: payload ?? parameters,
    timestamp: request.timestamp,
    metadata,
  };
}
