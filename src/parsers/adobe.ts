import type { ITrackerParser } from "./base";
import type { InterceptedRequest, ParsedEvent } from "../types";
import { parseQueryParams, createEvent } from "./utils";

export const adobeParser: ITrackerParser = {
  type: "adobe",
  name: "Adobe Analytics",

  matchesUrl(url: string): boolean {
    if (url.includes(".2o7.net") || url.includes(".omtrdc.net")) return true;
    return url.includes("/b/ss/");
  },

  parse(request: InterceptedRequest): ParsedEvent | null {
    const params = parseQueryParams(request.url);

    // Extract report suite ID from /b/ss/{rsid}/ path segment
    let rsid = "";
    const rsidMatch = request.url.match(/\/b\/ss\/([^/]+)\//);
    if (rsidMatch) rsid = rsidMatch[1];

    const pageName = params.pageName || params.gn || "";
    const events = params.events || params.pe || "";
    const eventName = pageName || events || "Page View";

    const parameters: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      // Label props (c1-c75) and eVars (v1-v250) for clarity
      const propMatch = key.match(/^c(\d+)$/);
      const evarMatch = key.match(/^v(\d+)$/);
      if (propMatch) {
        parameters[`prop${propMatch[1]}`] = value;
      } else if (evarMatch) {
        parameters[`eVar${evarMatch[1]}`] = value;
      } else {
        parameters[key] = value;
      }
    }

    if (rsid) parameters.rsid = rsid;
    if (pageName) parameters.pageName = pageName;
    if (events) parameters.events = events;

    return createEvent(
      request,
      "adobe",
      eventName,
      eventName,
      parameters,
      { trackingId: rsid },
      params
    );
  },
};
