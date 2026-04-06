import type { ITrackerParser } from "./base";
import type { InterceptedRequest, ParsedEvent } from "../types";
import { parseQueryParams, createEvent } from "./utils";

export const yandexParser: ITrackerParser = {
  type: "yandex",
  name: "Yandex Metrica",

  matchesUrl(url: string): boolean {
    return url.includes("mc.yandex.ru/watch/") || url.includes("mc.yandex.com/watch/");
  },

  parse(request: InterceptedRequest): ParsedEvent | null {
    const params = parseQueryParams(request.url);

    // Extract counter ID from URL path
    let counterId = "";
    const match = request.url.match(/\/watch\/(\d+)/);
    if (match) counterId = match[1];

    const pageView = params["page-url"] || "";
    const eventType = params["wmode"] === "7" ? "goal" : "page_view";

    return createEvent(
      request,
      "yandex",
      eventType,
      eventType,
      params,
      { trackingId: counterId }
    );
  },
};
