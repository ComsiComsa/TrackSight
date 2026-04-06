import type { ITrackerParser } from "./base";
import type { InterceptedRequest, ParsedEvent } from "../types";
import { safeJsonParse, createEvent } from "./utils";

export const plausibleParser: ITrackerParser = {
  type: "plausible",
  name: "Plausible",

  matchesUrl(url: string): boolean {
    return url.includes("plausible.io/api/event") || url.includes("/api/event");
  },

  parse(request: InterceptedRequest): ParsedEvent | null {
    if (!request.body) return null;

    const data = safeJsonParse(request.body) as Record<string, unknown> | null;
    if (!data) return null;

    const eventName = (data.n as string) || (data.name as string) || "pageview";
    const domain = (data.d as string) || (data.domain as string) || "";
    const url_ = (data.u as string) || (data.url as string) || "";

    const parameters: Record<string, string> = {
      name: eventName,
      domain,
      url: url_,
    };

    if (data.p || data.props) {
      const props = (data.p || data.props) as Record<string, unknown>;
      if (typeof props === "object") {
        for (const [k, v] of Object.entries(props)) {
          parameters[`prop.${k}`] = String(v);
        }
      }
    }

    return createEvent(
      request,
      "plausible",
      eventName,
      "event",
      parameters,
      { trackingId: domain },
      data
    );
  },
};
