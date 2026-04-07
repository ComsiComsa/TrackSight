import { describe, it, expect } from "vitest";
import type { InterceptedRequest } from "../src/types/events";
import { googleGA4Parser } from "../src/parsers/google-ga4";
import { facebookParser } from "../src/parsers/facebook";
import { tiktokParser } from "../src/parsers/tiktok";
import { amplitudeParser } from "../src/parsers/amplitude";
import { twitterParser } from "../src/parsers/twitter";
import { adobeParser } from "../src/parsers/adobe";

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

// ---------- Google GA4 ----------

describe("googleGA4Parser", () => {
  describe("matchesUrl", () => {
    it("should match google-analytics.com/g/collect", () => {
      expect(googleGA4Parser.matchesUrl("https://www.google-analytics.com/g/collect?v=2&tid=G-ABC")).toBe(true);
    });

    it("should match analytics.google.com/g/collect", () => {
      expect(googleGA4Parser.matchesUrl("https://analytics.google.com/g/collect?v=2")).toBe(true);
    });

    it("should not match unrelated URLs", () => {
      expect(googleGA4Parser.matchesUrl("https://example.com/page")).toBe(false);
      expect(googleGA4Parser.matchesUrl("https://google.com/search")).toBe(false);
    });
  });

  describe("parse", () => {
    it("should extract event name from POST body", () => {
      const request = makeRequest({
        url: "https://www.google-analytics.com/g/collect?v=2&tid=G-ABC123",
        body: "en=purchase&ep.currency=USD",
      });

      const result = googleGA4Parser.parse(request);

      expect(result).not.toBeNull();
      expect(result!.trackerName).toBe("GA4");
      expect(result!.eventName).toBe("purchase");
      expect(result!.metadata.trackingId).toBe("G-ABC123");
    });

    it("should default to page_view when no event name in query", () => {
      const request = makeRequest({
        url: "https://www.google-analytics.com/g/collect?v=2&tid=G-XYZ",
        body: null,
      });

      const result = googleGA4Parser.parse(request);

      expect(result).not.toBeNull();
      expect(result!.eventName).toBe("page_view");
    });

    it("should map GA4 shorthand params to readable names", () => {
      const request = makeRequest({
        url: "https://www.google-analytics.com/g/collect?v=2&tid=G-TEST&dl=https%3A%2F%2Fexample.com&dt=Home",
      });

      const result = googleGA4Parser.parse(request);

      expect(result).not.toBeNull();
      expect(result!.parameters.document_location).toBe("https://example.com");
      expect(result!.parameters.document_title).toBe("Home");
    });
  });
});

// ---------- Facebook ----------

describe("facebookParser", () => {
  describe("matchesUrl", () => {
    it("should match facebook.com/tr", () => {
      expect(facebookParser.matchesUrl("https://www.facebook.com/tr?id=123&ev=PageView")).toBe(true);
    });

    it("should match facebook.net/tr", () => {
      expect(facebookParser.matchesUrl("https://connect.facebook.net/tr?id=456")).toBe(true);
    });

    it("should not match translate.facebook.com", () => {
      expect(facebookParser.matchesUrl("https://translate.facebook.com/tr")).toBe(false);
    });

    it("should not match unrelated URLs", () => {
      expect(facebookParser.matchesUrl("https://example.com/page")).toBe(false);
    });
  });

  describe("parse", () => {
    it("should extract pixel ID and event name", () => {
      const request = makeRequest({
        url: "https://www.facebook.com/tr?id=9876543210&ev=Purchase&cd[value]=29.99&cd[currency]=USD",
      });

      const result = facebookParser.parse(request);

      expect(result).not.toBeNull();
      expect(result!.trackerName).toBe("Facebook Pixel");
      expect(result!.eventName).toBe("Purchase");
      expect(result!.metadata.trackingId).toBe("9876543210");
      expect(result!.parameters.value).toBe("29.99");
      expect(result!.parameters.currency).toBe("USD");
    });

    it("should default event name to Unknown when ev param is missing", () => {
      const request = makeRequest({
        url: "https://www.facebook.com/tr?id=111",
      });

      const result = facebookParser.parse(request);

      expect(result).not.toBeNull();
      expect(result!.eventName).toBe("Unknown");
    });
  });
});

// ---------- TikTok ----------

describe("tiktokParser", () => {
  describe("matchesUrl", () => {
    it("should match analytics.tiktok.com", () => {
      expect(tiktokParser.matchesUrl("https://analytics.tiktok.com/api/v2/pixel")).toBe(true);
    });

    it("should not match unrelated URLs", () => {
      expect(tiktokParser.matchesUrl("https://www.tiktok.com/watch")).toBe(false);
      expect(tiktokParser.matchesUrl("https://example.com")).toBe(false);
    });
  });

  describe("parse", () => {
    it("should parse JSON body and extract event and pixel code", () => {
      const body = JSON.stringify({
        event: "AddToCart",
        event_id: "evt_123",
        context: {
          pixel: { code: "PIXEL_ABC" },
          page: { url: "https://shop.com/item", referrer: "https://google.com" },
          user: { anonymous_id: "anon_42" },
          library: { name: "tiktok-sdk", version: "1.0" },
        },
        properties: {
          value: "49.99",
          currency: "USD",
        },
      });

      const request = makeRequest({
        url: "https://analytics.tiktok.com/api/v2/pixel",
        body,
      });

      const result = tiktokParser.parse(request);

      expect(result).not.toBeNull();
      expect(result!.trackerName).toBe("TikTok Pixel");
      expect(result!.eventName).toBe("AddToCart");
      expect(result!.metadata.trackingId).toBe("PIXEL_ABC");
      expect(result!.parameters.url).toBe("https://shop.com/item");
      expect(result!.parameters.referrer).toBe("https://google.com");
      expect(result!.parameters.anonymous_id).toBe("anon_42");
      expect(result!.parameters["prop.value"]).toBe("49.99");
      expect(result!.parameters["prop.currency"]).toBe("USD");
    });

    it("should fallback to query params when no JSON body", () => {
      const request = makeRequest({
        url: "https://analytics.tiktok.com/api/v1/pixel?ev=PageVisit&sdkid=SDK_XYZ",
        body: null,
      });

      const result = tiktokParser.parse(request);

      expect(result).not.toBeNull();
      expect(result!.eventName).toBe("PageVisit");
      expect(result!.metadata.trackingId).toBe("SDK_XYZ");
    });
  });
});

// ---------- Amplitude ----------

describe("amplitudeParser", () => {
  describe("matchesUrl", () => {
    it("should match api.amplitude.com", () => {
      expect(amplitudeParser.matchesUrl("https://api.amplitude.com/2/httpapi")).toBe(true);
    });

    it("should match api2.amplitude.com", () => {
      expect(amplitudeParser.matchesUrl("https://api2.amplitude.com/2/httpapi")).toBe(true);
    });

    it("should match api.eu.amplitude.com", () => {
      expect(amplitudeParser.matchesUrl("https://api.eu.amplitude.com/2/httpapi")).toBe(true);
    });

    it("should not match unrelated URLs", () => {
      expect(amplitudeParser.matchesUrl("https://example.com")).toBe(false);
      expect(amplitudeParser.matchesUrl("https://amplitude.com/pricing")).toBe(false);
    });
  });

  describe("parse", () => {
    it("should parse JSON body with events array", () => {
      const body = JSON.stringify({
        api_key: "amp_key_123",
        events: [
          {
            event_type: "button_click",
            user_id: "user_42",
            device_id: "dev_99",
            event_properties: { button_name: "signup", page: "home" },
            platform: "Web",
          },
        ],
      });

      const request = makeRequest({
        url: "https://api2.amplitude.com/2/httpapi",
        body,
      });

      const result = amplitudeParser.parse(request);

      expect(result).not.toBeNull();
      expect(result!.trackerName).toBe("Amplitude");
      expect(result!.eventName).toBe("button_click");
      expect(result!.metadata.trackingId).toBe("amp_key_123");
      expect(result!.parameters.button_name).toBe("signup");
      expect(result!.parameters.page).toBe("home");
      expect(result!.parameters.user_id).toBe("user_42");
      expect(result!.parameters.device_id).toBe("dev_99");
      expect(result!.parameters.platform).toBe("Web");
    });

    it("should return null when body is missing", () => {
      const request = makeRequest({
        url: "https://api2.amplitude.com/2/httpapi",
        body: null,
      });

      const result = amplitudeParser.parse(request);

      expect(result).toBeNull();
    });

    it("should return null when events array is empty", () => {
      const body = JSON.stringify({
        api_key: "key",
        events: [],
      });

      const request = makeRequest({
        url: "https://api2.amplitude.com/2/httpapi",
        body,
      });

      const result = amplitudeParser.parse(request);

      expect(result).toBeNull();
    });
  });
});

// ---------- Twitter ----------

describe("twitterParser", () => {
  describe("matchesUrl", () => {
    it("should match analytics.twitter.com", () => {
      expect(twitterParser.matchesUrl("https://analytics.twitter.com/1/i/adsct")).toBe(true);
    });

    it("should match t.co/i/adsct", () => {
      expect(twitterParser.matchesUrl("https://t.co/i/adsct?p_id=Twitter")).toBe(true);
    });

    it("should match ads-api.twitter.com", () => {
      expect(twitterParser.matchesUrl("https://ads-api.twitter.com/measurement")).toBe(true);
    });

    it("should not match unrelated URLs", () => {
      expect(twitterParser.matchesUrl("https://twitter.com/home")).toBe(false);
      expect(twitterParser.matchesUrl("https://example.com")).toBe(false);
    });
  });

  describe("parse", () => {
    it("should extract event and pixel ID from query params", () => {
      const request = makeRequest({
        url: "https://analytics.twitter.com/1/i/adsct?event=Purchase&p_id=twtr_px_123",
      });

      const result = twitterParser.parse(request);

      expect(result).not.toBeNull();
      expect(result!.trackerName).toBe("Twitter/X Pixel");
      expect(result!.eventName).toBe("Purchase");
      expect(result!.metadata.trackingId).toBe("twtr_px_123");
    });

    it("should fallback to txn_id for event name", () => {
      const request = makeRequest({
        url: "https://analytics.twitter.com/1/i/adsct?txn_id=conv_abc&p_id=tw_001",
      });

      const result = twitterParser.parse(request);

      expect(result).not.toBeNull();
      expect(result!.eventName).toBe("conv_abc");
    });

    it("should default to PageView when no event params present", () => {
      const request = makeRequest({
        url: "https://analytics.twitter.com/1/i/adsct",
      });

      const result = twitterParser.parse(request);

      expect(result).not.toBeNull();
      expect(result!.eventName).toBe("PageView");
    });
  });
});

// ---------- Adobe ----------

describe("adobeParser", () => {
  describe("matchesUrl", () => {
    it("should match .2o7.net domains", () => {
      expect(adobeParser.matchesUrl("https://metrics.example.2o7.net/b/ss/rsid/1/H.27")).toBe(true);
    });

    it("should match .omtrdc.net domains", () => {
      expect(adobeParser.matchesUrl("https://metrics.example.omtrdc.net/b/ss/rsid/1")).toBe(true);
    });

    it("should match /b/ss/ path", () => {
      expect(adobeParser.matchesUrl("https://smetrics.example.com/b/ss/myreportsuite/1/JS-2.0")).toBe(true);
    });

    it("should not match unrelated URLs", () => {
      expect(adobeParser.matchesUrl("https://example.com/page")).toBe(false);
      expect(adobeParser.matchesUrl("https://adobe.com")).toBe(false);
    });
  });

  describe("parse", () => {
    it("should extract report suite ID from URL path", () => {
      const request = makeRequest({
        url: "https://smetrics.example.2o7.net/b/ss/myrsid/1/JS-2.22.0/s123?pageName=Home&events=event1&c1=val1&v5=campaign_abc",
      });

      const result = adobeParser.parse(request);

      expect(result).not.toBeNull();
      expect(result!.trackerName).toBe("Adobe Analytics");
      expect(result!.metadata.trackingId).toBe("myrsid");
      expect(result!.parameters.rsid).toBe("myrsid");
      expect(result!.parameters.pageName).toBe("Home");
      expect(result!.parameters.events).toBe("event1");
    });

    it("should rename prop and eVar params to readable names", () => {
      const request = makeRequest({
        url: "https://smetrics.example.2o7.net/b/ss/suite1/1/H.27?c1=propval&v10=evarval",
      });

      const result = adobeParser.parse(request);

      expect(result).not.toBeNull();
      expect(result!.parameters.prop1).toBe("propval");
      expect(result!.parameters.eVar10).toBe("evarval");
    });

    it("should use pageName as event name when available", () => {
      const request = makeRequest({
        url: "https://smetrics.example.2o7.net/b/ss/suite1/1/H.27?pageName=ProductDetail",
      });

      const result = adobeParser.parse(request);

      expect(result).not.toBeNull();
      expect(result!.eventName).toBe("ProductDetail");
    });

    it("should default to Page View when no pageName or events", () => {
      const request = makeRequest({
        url: "https://smetrics.example.2o7.net/b/ss/suite1/1/H.27",
      });

      const result = adobeParser.parse(request);

      expect(result).not.toBeNull();
      expect(result!.eventName).toBe("Page View");
    });
  });
});
