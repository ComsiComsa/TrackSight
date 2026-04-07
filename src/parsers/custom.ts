import type { InterceptedRequest, ParsedEvent, CustomTracker, KeywordRule } from "../types";
import { safeJsonParse, parseQueryParams, createEvent, isSafeKey } from "./utils";

let customTrackers: CustomTracker[] = [];
let keywordRules: KeywordRule[] = [];

export function setCustomTrackers(trackers: CustomTracker[]) {
  customTrackers = trackers;
}

export function setKeywordRules(rules: KeywordRule[]) {
  keywordRules = rules;
}

/** Match against custom tracker URL patterns */
export function matchCustomTracker(url: string, method: string): CustomTracker | null {
  for (const tracker of customTrackers) {
    if (!tracker.enabled) continue;
    if (tracker.method !== "ANY" && tracker.method !== method) continue;
    if (url.includes(tracker.urlPattern)) return tracker;
  }
  return null;
}

/** Match against keyword rules — checks URL and/or body */
export function matchKeywordRule(url: string, body: string | null): KeywordRule | null {
  for (const rule of keywordRules) {
    if (!rule.enabled) continue;

    const haystack: string[] = [];
    if (rule.matchIn === "url" || rule.matchIn === "both") {
      haystack.push(url.toLowerCase());
    }
    if (rule.matchIn === "body" || rule.matchIn === "both") {
      if (body) haystack.push(body.toLowerCase());
    }

    const text = haystack.join(" ");
    const matched = rule.keywords.some((kw) => text.includes(kw.toLowerCase().trim()));
    if (matched) return rule;
  }
  return null;
}

export function parseCustomRequest(
  request: InterceptedRequest,
  tracker: CustomTracker
): ParsedEvent {
  const params = parseQueryParams(request.url);
  let bodyData: Record<string, unknown> | null = null;
  if (request.body) {
    bodyData = safeJsonParse(request.body) as Record<string, unknown> | null;
  }

  const parameters: Record<string, string> = { ...params };
  if (bodyData && typeof bodyData === "object") {
    for (const [k, v] of Object.entries(bodyData)) {
      if (!isSafeKey(k)) continue;
      parameters[k] = typeof v === "object" ? JSON.stringify(v) : String(v);
    }
  }

  const eventName = (bodyData?.event as string) ||
    (bodyData?.type as string) ||
    (bodyData?.action as string) ||
    request.method;

  const event = createEvent(
    request,
    "custom",
    eventName,
    "custom",
    parameters,
    { trackingId: tracker.name },
    bodyData ?? params
  );
  event.trackerName = tracker.name;
  return event;
}

export function parseKeywordMatch(
  request: InterceptedRequest,
  rule: KeywordRule
): ParsedEvent {
  const params = parseQueryParams(request.url);
  let bodyData: Record<string, unknown> | null = null;
  if (request.body) {
    bodyData = safeJsonParse(request.body) as Record<string, unknown> | null;
  }

  const parameters: Record<string, string> = { ...params };
  if (bodyData && typeof bodyData === "object") {
    for (const [k, v] of Object.entries(bodyData)) {
      if (!isSafeKey(k)) continue;
      parameters[k] = typeof v === "object" ? JSON.stringify(v) : String(v);
    }
  }

  // Try to extract an event name from common fields
  const eventName = (bodyData?.event as string) ||
    (bodyData?.event_name as string) ||
    (bodyData?.type as string) ||
    (bodyData?.action as string) ||
    (bodyData?.name as string) ||
    new URL(request.url, "https://x").pathname.split("/").pop() ||
    request.method;

  const event = createEvent(
    request,
    "custom",
    eventName,
    "keyword:" + rule.label,
    parameters,
    { trackingId: rule.label, matchedKeywords: rule.keywords.join(", ") },
    bodyData ?? params
  );
  event.trackerName = rule.label;
  return event;
}
