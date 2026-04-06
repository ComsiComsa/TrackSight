import type { ITrackerParser } from "./base";
import type { InterceptedRequest, ParsedEvent } from "../types";
import { parseQueryParams, createEvent } from "./utils";

export const linkedinParser: ITrackerParser = {
  type: "linkedin",
  name: "LinkedIn Insight",

  matchesUrl(url: string): boolean {
    return (
      url.includes("px.ads.linkedin.com/collect") ||
      url.includes("snap.licdn.com/li.lms-analytics")
    );
  },

  parse(request: InterceptedRequest): ParsedEvent | null {
    const params = parseQueryParams(request.url);
    const partnerId = params.pid || "";
    const conversionId = params.conversionId || "";

    let eventName: string;
    let eventType: string;

    if (conversionId) {
      eventName = `conversion:${conversionId}`;
      eventType = "conversion";
    } else {
      eventName = "page_view";
      eventType = "page_view";
    }

    const parameters: Record<string, string> = {};
    if (params.pid) parameters.partner_id = params.pid;
    if (params.conversionId) parameters.conversion_id = params.conversionId;
    if (params.url) parameters.url = params.url;
    if (params.referer) parameters.referrer = params.referer;
    if (params.title) parameters.title = params.title;
    if (params.fmt) parameters.format = params.fmt;
    if (params.li_fat_id) parameters.li_fat_id = params.li_fat_id;

    return createEvent(
      request,
      "linkedin",
      eventName,
      eventType,
      parameters,
      { trackingId: partnerId },
      params
    );
  },
};
