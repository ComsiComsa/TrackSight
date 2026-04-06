import type { ITrackerParser } from "./base";
import type { InterceptedRequest, ParsedEvent } from "../types";
import { parseQueryParams, parseFormBody, createEvent } from "./utils";

export const facebookParser: ITrackerParser = {
  type: "facebook",
  name: "Facebook Pixel",

  matchesUrl(url: string): boolean {
    return (
      (url.includes("facebook.com/tr") || url.includes("facebook.net/tr")) &&
      !url.includes("translate.") // avoid false match on translate.facebook.com
    );
  },

  parse(request: InterceptedRequest): ParsedEvent | null {
    // Facebook uses query params (GET) or form-encoded POST body
    let params = parseQueryParams(request.url);
    if (request.body) {
      params = { ...params, ...parseFormBody(request.body) };
    }

    const eventName = params.ev || "Unknown";
    const pixelId = params.id || "";

    // Parse cd[key] custom data params
    const parameters: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      const cdMatch = key.match(/^cd\[(.+)]$/);
      if (cdMatch) {
        parameters[cdMatch[1]] = value;
      } else if (key.startsWith("ud[")) {
        // User data (hashed PII) — include but mark
        const udKey = key.match(/^ud\[(.+)]$/);
        if (udKey) parameters[`user.${udKey[1]}`] = value.slice(0, 12) + "...";
      } else {
        parameters[key] = value;
      }
    }

    return createEvent(
      request,
      "facebook",
      eventName,
      eventName,
      parameters,
      { trackingId: pixelId },
      params
    );
  },
};
