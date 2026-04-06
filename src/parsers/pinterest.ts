import type { ITrackerParser } from "./base";
import type { InterceptedRequest, ParsedEvent } from "../types";
import { parseQueryParams, createEvent } from "./utils";

export const pinterestParser: ITrackerParser = {
  type: "pinterest",
  name: "Pinterest Tag",

  matchesUrl(url: string): boolean {
    return url.includes("ct.pinterest.com") && url.includes("/v3/");
  },

  parse(request: InterceptedRequest): ParsedEvent | null {
    const params = parseQueryParams(request.url);
    const eventName = params.event || "page_visit";
    const tagId = params.tid || "";

    return createEvent(
      request,
      "pinterest",
      eventName,
      "event",
      params,
      { trackingId: tagId }
    );
  },
};
