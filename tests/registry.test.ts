import { describe, it, expect } from "vitest";
import type { InterceptedRequest } from "../src/types/events";
import { parseRequest } from "../src/parsers/registry";

function makeRequest(overrides: Partial<InterceptedRequest> = {}): InterceptedRequest {
  return {
    url: "https://example.com",
    method: "POST",
    body: null,
    timestamp: Date.now(),
    source: "fetch",
    ...overrides,
  };
}

describe("parseRequest", () => {
  it("should return null for an unknown URL", () => {
    const request = makeRequest({ url: "https://unknown-service.example.com/api/data" });
    expect(parseRequest(request)).toBeNull();
  });

  // ---------- GA4 ----------

  it("should parse a GA4 request", () => {
    const request = makeRequest({
      url: "https://www.google-analytics.com/g/collect?v=2&tid=G-ABC123",
      body: "en=purchase",
    });

    const result = parseRequest(request);

    expect(result).not.toBeNull();
    expect(result!.tracker).toBe("ga4");
    expect(result!.trackerName).toBe("GA4");
    expect(result!.eventName).toBe("purchase");
  });

  // ---------- Facebook ----------

  it("should parse a Facebook Pixel request", () => {
    const request = makeRequest({
      url: "https://www.facebook.com/tr?id=123456&ev=PageView",
    });

    const result = parseRequest(request);

    expect(result).not.toBeNull();
    expect(result!.tracker).toBe("facebook");
    expect(result!.trackerName).toBe("Facebook Pixel");
    expect(result!.eventName).toBe("PageView");
  });

  // ---------- TikTok ----------

  it("should parse a TikTok request with JSON body", () => {
    const request = makeRequest({
      url: "https://analytics.tiktok.com/api/v2/pixel",
      body: JSON.stringify({
        event: "AddToCart",
        context: { pixel: { code: "PX_1" }, page: {}, user: {}, library: {} },
        properties: {},
      }),
    });

    const result = parseRequest(request);

    expect(result).not.toBeNull();
    expect(result!.tracker).toBe("tiktok");
    expect(result!.trackerName).toBe("TikTok Pixel");
    expect(result!.eventName).toBe("AddToCart");
  });

  // ---------- Segment ----------

  it("should parse a Segment request", () => {
    const request = makeRequest({
      url: "https://api.segment.io/v1/track",
      body: JSON.stringify({
        type: "track",
        event: "Order Completed",
        writeKey: "wk_123",
      }),
    });

    const result = parseRequest(request);

    expect(result).not.toBeNull();
    expect(result!.tracker).toBe("segment");
    expect(result!.trackerName).toBe("Segment");
    expect(result!.eventName).toBe("Order Completed");
  });

  // ---------- Amplitude ----------

  it("should parse an Amplitude request", () => {
    const request = makeRequest({
      url: "https://api2.amplitude.com/2/httpapi",
      body: JSON.stringify({
        api_key: "amp_key",
        events: [{ event_type: "signup", event_properties: {} }],
      }),
    });

    const result = parseRequest(request);

    expect(result).not.toBeNull();
    expect(result!.tracker).toBe("amplitude");
    expect(result!.trackerName).toBe("Amplitude");
    expect(result!.eventName).toBe("signup");
  });

  // ---------- Mixpanel ----------

  it("should parse a Mixpanel request", () => {
    const data = JSON.stringify([{ event: "ButtonClick", properties: { token: "mx_tok" } }]);
    const request = makeRequest({
      url: "https://api-js.mixpanel.com/track",
      body: data,
    });

    const result = parseRequest(request);

    expect(result).not.toBeNull();
    expect(result!.tracker).toBe("mixpanel");
    expect(result!.trackerName).toBe("Mixpanel");
    expect(result!.eventName).toBe("ButtonClick");
  });

  // ---------- PostHog ----------

  it("should parse a PostHog request", () => {
    const request = makeRequest({
      url: "https://us.i.posthog.com/e/",
      body: JSON.stringify({ event: "$autocapture", properties: {}, token: "ph_tok" }),
    });

    const result = parseRequest(request);

    expect(result).not.toBeNull();
    expect(result!.tracker).toBe("posthog");
    expect(result!.trackerName).toBe("PostHog");
    expect(result!.eventName).toBe("$autocapture");
  });

  // ---------- Hotjar ----------

  it("should parse a Hotjar request", () => {
    const request = makeRequest({
      url: "https://in.hotjar.com/api/v2/sites/12345/visit-data",
      body: JSON.stringify({ url: "https://example.com", title: "Home" }),
    });

    const result = parseRequest(request);

    expect(result).not.toBeNull();
    expect(result!.tracker).toBe("hotjar");
    expect(result!.trackerName).toBe("Hotjar");
    expect(result!.eventName).toBe("visit_data");
  });

  // ---------- Yandex ----------

  it("should parse a Yandex Metrica request", () => {
    const request = makeRequest({
      url: "https://mc.yandex.ru/watch/98765?page-url=https://example.com",
      method: "GET",
      body: null,
    });

    const result = parseRequest(request);

    expect(result).not.toBeNull();
    expect(result!.tracker).toBe("yandex");
    expect(result!.trackerName).toBe("Yandex Metrica");
    expect(result!.eventName).toBe("page_view");
  });

  // ---------- Snap ----------

  it("should parse a Snap Pixel request", () => {
    const request = makeRequest({
      url: "https://tr.snapchat.com/p?e_et=PURCHASE&pid=snap_px_1",
      method: "GET",
      body: null,
    });

    const result = parseRequest(request);

    expect(result).not.toBeNull();
    expect(result!.tracker).toBe("snap");
    expect(result!.trackerName).toBe("Snap Pixel");
    expect(result!.eventName).toBe("PURCHASE");
  });

  // ---------- LinkedIn ----------

  it("should parse a LinkedIn Insight request", () => {
    const request = makeRequest({
      url: "https://px.ads.linkedin.com/collect?pid=12345&fmt=js",
      method: "GET",
      body: null,
    });

    const result = parseRequest(request);

    expect(result).not.toBeNull();
    expect(result!.tracker).toBe("linkedin");
    expect(result!.trackerName).toBe("LinkedIn");
    expect(result!.eventName).toBe("page_view");
  });

  // ---------- Pinterest ----------

  it("should parse a Pinterest Tag request", () => {
    const request = makeRequest({
      url: "https://ct.pinterest.com/v3/?event=checkout&tid=tag_123",
      method: "GET",
      body: null,
    });

    const result = parseRequest(request);

    expect(result).not.toBeNull();
    expect(result!.tracker).toBe("pinterest");
    expect(result!.trackerName).toBe("Pinterest");
    expect(result!.eventName).toBe("checkout");
  });

  // ---------- Heap ----------

  it("should parse a Heap request", () => {
    const request = makeRequest({
      url: "https://heapanalytics.com/h",
      body: JSON.stringify({ t: "click", a: "heap_app_1" }),
    });

    const result = parseRequest(request);

    expect(result).not.toBeNull();
    expect(result!.tracker).toBe("heap");
    expect(result!.trackerName).toBe("Heap");
    expect(result!.eventName).toBe("click");
  });

  // ---------- Plausible ----------

  it("should parse a Plausible request", () => {
    const request = makeRequest({
      url: "https://plausible.io/api/event",
      body: JSON.stringify({ n: "pageview", d: "example.com", u: "https://example.com" }),
    });

    const result = parseRequest(request);

    expect(result).not.toBeNull();
    expect(result!.tracker).toBe("plausible");
    expect(result!.trackerName).toBe("Plausible");
    expect(result!.eventName).toBe("pageview");
  });

  // ---------- RudderStack ----------

  it("should parse a RudderStack request", () => {
    const request = makeRequest({
      url: "https://dataplane.rudderstack.com/v1/track",
      body: JSON.stringify({ type: "track", event: "Product Viewed", writeKey: "rs_key" }),
    });

    const result = parseRequest(request);

    expect(result).not.toBeNull();
    expect(result!.tracker).toBe("rudderstack");
    expect(result!.trackerName).toBe("RudderStack");
    expect(result!.eventName).toBe("Product Viewed");
  });

  // ---------- GTM ----------

  it("should parse a Google Tag Manager request", () => {
    const request = makeRequest({
      url: "https://www.googletagmanager.com/gtm.js?id=GTM-ABCDEF",
      method: "GET",
      body: null,
    });

    const result = parseRequest(request);

    expect(result).not.toBeNull();
    expect(result!.tracker).toBe("gtm");
    expect(result!.trackerName).toBe("GTM");
    expect(result!.eventName).toBe("container_load");
  });

  // ---------- Google UA ----------

  it("should parse a Google Universal Analytics request", () => {
    const request = makeRequest({
      url: "https://www.google-analytics.com/collect?v=1&tid=UA-12345-1&t=pageview",
      method: "GET",
      body: null,
    });

    const result = parseRequest(request);

    expect(result).not.toBeNull();
    expect(result!.tracker).toBe("google-ua");
    expect(result!.trackerName).toBe("Google UA");
    expect(result!.eventName).toBe("Page View");
  });

  // ---------- Twitter ----------

  it("should parse a Twitter/X Pixel request", () => {
    const request = makeRequest({
      url: "https://analytics.twitter.com/1/i/adsct?event=Purchase&p_id=tw_px",
    });

    const result = parseRequest(request);

    expect(result).not.toBeNull();
    expect(result!.tracker).toBe("twitter");
    expect(result!.trackerName).toBe("Twitter/X Pixel");
    expect(result!.eventName).toBe("Purchase");
  });

  // ---------- Reddit ----------

  it("should parse a Reddit Pixel request", () => {
    const request = makeRequest({
      url: "https://alb.reddit.com/rp.gif?event=ViewContent&advertiser_id=rd_123",
      method: "GET",
      body: null,
    });

    const result = parseRequest(request);

    expect(result).not.toBeNull();
    expect(result!.tracker).toBe("reddit");
    expect(result!.trackerName).toBe("Reddit Pixel");
    expect(result!.eventName).toBe("ViewContent");
  });

  // ---------- Criteo ----------

  it("should parse a Criteo request", () => {
    const request = makeRequest({
      url: "https://dis.criteo.com/dis/rtb/appnexusandbidswitch/cookiematch.aspx?event=ViewItem&a=acct_1",
      method: "GET",
      body: null,
    });

    const result = parseRequest(request);

    expect(result).not.toBeNull();
    expect(result!.tracker).toBe("criteo");
    expect(result!.trackerName).toBe("Criteo");
    expect(result!.eventName).toBe("ViewItem");
  });

  // ---------- Adobe ----------

  it("should parse an Adobe Analytics request with /b/ss/ path", () => {
    const request = makeRequest({
      url: "https://smetrics.example.2o7.net/b/ss/myrsid/1/JS-2.22.0?pageName=Home",
      method: "GET",
      body: null,
    });

    const result = parseRequest(request);

    expect(result).not.toBeNull();
    expect(result!.tracker).toBe("adobe");
    expect(result!.trackerName).toBe("Adobe Analytics");
    expect(result!.eventName).toBe("Home");
  });
});
