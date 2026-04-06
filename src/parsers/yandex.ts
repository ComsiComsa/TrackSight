import type { ITrackerParser } from "./base";
import type { InterceptedRequest, ParsedEvent } from "../types";
import { parseQueryParams, safeJsonParse, createEvent } from "./utils";

export const yandexParser: ITrackerParser = {
  type: "yandex",
  name: "Yandex Metrica",

  matchesUrl(url: string): boolean {
    return url.includes("mc.yandex.ru/watch/") || url.includes("mc.yandex.com/watch/");
  },

  parse(request: InterceptedRequest): ParsedEvent | null {
    const params = parseQueryParams(request.url);

    // Extract counter ID from URL path: /watch/<counter_id>
    let counterId = "";
    const match = request.url.match(/\/watch\/(\d+)/);
    if (match) counterId = match[1];

    // Parse browser-info (semicolon-delimited key:value pairs)
    const browserInfo: Record<string, string> = {};
    if (params["browser-info"]) {
      for (const part of params["browser-info"].split(";")) {
        const idx = part.indexOf(":");
        if (idx > 0) {
          browserInfo[part.slice(0, idx)] = part.slice(idx + 1);
        }
      }
    }

    // Detect event type from page-url
    const pageUrl = params["page-url"] || "";
    let eventType = "page_view";
    let eventName = "page_view";

    if (pageUrl.startsWith("goal://")) {
      // Goal: page-url=goal://hostname/goal_name
      eventType = "goal";
      const goalMatch = pageUrl.match(/goal:\/\/[^/]+\/(.+)/);
      eventName = goalMatch ? goalMatch[1] : "goal";
    } else if (browserInfo.pa === "1") {
      // Params hit (custom parameters, not a pageview)
      eventType = "params";
      eventName = "params";
    }

    // Build parameters
    const parameters: Record<string, string> = {};
    if (pageUrl && !pageUrl.startsWith("goal://")) parameters.url = pageUrl;
    if (params["page-ref"]) parameters.referrer = params["page-ref"];
    if (browserInfo.t) parameters.title = browserInfo.t;
    if (browserInfo.s) parameters.screen = browserInfo.s;
    if (browserInfo.la) parameters.language = browserInfo.la;

    // Parse goal-params or site-info (JSON)
    if (params["goal-params"]) {
      const goalParams = safeJsonParse(params["goal-params"]);
      if (goalParams && typeof goalParams === "object") {
        for (const [k, v] of Object.entries(goalParams as Record<string, unknown>)) {
          parameters[`goal.${k}`] = typeof v === "object" ? JSON.stringify(v) : String(v);
        }
      }
    }
    if (params["site-info"]) {
      const siteInfo = safeJsonParse(params["site-info"]);
      if (siteInfo && typeof siteInfo === "object") {
        for (const [k, v] of Object.entries(siteInfo as Record<string, unknown>)) {
          parameters[`site.${k}`] = typeof v === "object" ? JSON.stringify(v) : String(v);
        }
      }
    }

    return createEvent(
      request,
      "yandex",
      eventName,
      eventType,
      parameters,
      { trackingId: counterId },
      { queryParams: params, browserInfo }
    );
  },
};
