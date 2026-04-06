import type { ITrackerParser } from "./base";
import type { InterceptedRequest, ParsedEvent } from "../types";
import { parseQueryParams, createEvent } from "./utils";

export const snapParser: ITrackerParser = {
  type: "snap",
  name: "Snap Pixel",

  matchesUrl(url: string): boolean {
    return url.includes("tr.snapchat.com/p") || url.includes("tr.snapchat.com/cm");
  },

  parse(request: InterceptedRequest): ParsedEvent | null {
    const params = parseQueryParams(request.url);
    const eventName = params.e_et || params.ev || "PAGE_VIEW";
    const pixelId = params.pid || params.u_sn || "";

    return createEvent(
      request,
      "snap",
      eventName,
      "event",
      params,
      { trackingId: pixelId }
    );
  },
};
