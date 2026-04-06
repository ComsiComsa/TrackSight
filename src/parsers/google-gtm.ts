import type { ITrackerParser } from "./base";
import type { InterceptedRequest, ParsedEvent } from "../types";
import { parseQueryParams, createEvent } from "./utils";

export const googleGTMParser: ITrackerParser = {
  type: "gtm",
  name: "Google Tag Manager",

  matchesUrl(url: string): boolean {
    return url.includes("googletagmanager.com/gtm.js") || url.includes("googletagmanager.com/gtag/js");
  },

  parse(request: InterceptedRequest): ParsedEvent | null {
    const params = parseQueryParams(request.url);
    const containerId = params.id || "";

    return createEvent(
      request,
      "gtm",
      "container_load",
      "load",
      params,
      { trackingId: containerId },
      params
    );
  },
};
