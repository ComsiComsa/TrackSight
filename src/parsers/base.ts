import type { InterceptedRequest, ParsedEvent, TrackerType } from "../types";

export interface ITrackerParser {
  type: TrackerType;
  name: string;
  matchesUrl(url: string): boolean;
  parse(request: InterceptedRequest): ParsedEvent | null;
}
