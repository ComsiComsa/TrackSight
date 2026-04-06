import type { InterceptedRequest, ParsedEvent } from "./events";

export type Message =
  | { type: "INTERCEPTED_REQUEST"; payload: InterceptedRequest }
  | { type: "PARSED_EVENT"; payload: ParsedEvent }
  | { type: "CLEAR_EVENTS"; payload: { tabId: number } }
  | { type: "GET_EVENTS"; payload: { tabId: number } }
  | { type: "EVENTS_BATCH"; payload: ParsedEvent[] };

export const MSG = {
  INTERCEPTED_REQUEST: "INTERCEPTED_REQUEST",
  PARSED_EVENT: "PARSED_EVENT",
  CLEAR_EVENTS: "CLEAR_EVENTS",
  GET_EVENTS: "GET_EVENTS",
  EVENTS_BATCH: "EVENTS_BATCH",
} as const;
