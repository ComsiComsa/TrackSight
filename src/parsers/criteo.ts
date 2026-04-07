import type { ITrackerParser } from "./base";
import type { InterceptedRequest, ParsedEvent } from "../types";
import { parseQueryParams, parseFormBody, safeJsonParse, createEvent } from "./utils";

export const criteoParser: ITrackerParser = {
  type: "criteo",
  name: "Criteo",

  matchesUrl(url: string): boolean {
    return (
      url.includes("dis.criteo.com") ||
      url.includes("sslwidget.criteo.com") ||
      url.includes("static.criteo.net")
    );
  },

  parse(request: InterceptedRequest): ParsedEvent | null {
    let params = parseQueryParams(request.url);
    if (request.body) {
      const json = safeJsonParse(request.body) as Record<string, unknown> | null;
      if (json && typeof json === "object") {
        for (const [key, value] of Object.entries(json)) {
          params[key] = typeof value === "object" ? JSON.stringify(value) : String(value);
        }
      } else {
        params = { ...params, ...parseFormBody(request.body) };
      }
    }

    const eventName = params.event || params.e || params.type || "ViewItem";
    const accountId = params.a || params.account || params.networkid || "";

    const parameters: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      parameters[key] = value;
    }

    return createEvent(
      request,
      "criteo",
      eventName,
      eventName,
      parameters,
      { trackingId: accountId },
      params
    );
  },
};
