import type { ITrackerParser } from "./base";
import type { InterceptedRequest, ParsedEvent } from "../types";
import { parseQueryParams, createEvent } from "./utils";

export const linkedinParser: ITrackerParser = {
  type: "linkedin",
  name: "LinkedIn Insight",

  matchesUrl(url: string): boolean {
    return url.includes("px.ads.linkedin.com") || url.includes("snap.licdn.com/li.lms-analytics");
  },

  parse(request: InterceptedRequest): ParsedEvent | null {
    const params = parseQueryParams(request.url);
    const partnerId = params.pid || "";
    const conversionId = params.conversionId || "";
    const eventName = conversionId ? `conversion:${conversionId}` : "page_view";

    return createEvent(
      request,
      "linkedin",
      eventName,
      conversionId ? "conversion" : "page_view",
      params,
      { trackingId: partnerId }
    );
  },
};
