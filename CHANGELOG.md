# Changelog

All notable changes to TrackSight will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-04-07

### Added

- Real-time interception of analytics events (fetch, XHR, beacon, pixel)
- **Dashboard view** with tracker overview cards, search, tracking IDs, event counts, and top events
- **Events view** with grouped event list, search, tracker filtering, and event type filtering
- **Event detail** with parsed parameters, raw request data, and Copy JSON button
- **DevTools panel** with full feature parity to the popup
- Support for **21 built-in trackers**:
  - Google Analytics 4, Google Universal Analytics, Google Tag Manager
  - Facebook Pixel, TikTok Pixel, Snap Pixel, Pinterest Tag
  - Segment, Amplitude, Mixpanel, PostHog, Heap
  - Hotjar, Yandex Metrica, Plausible, RudderStack
  - LinkedIn Insight Tag, Twitter/X Pixel, Reddit Pixel, Criteo, Adobe Analytics
- **Custom trackers** via URL pattern matching with validation
- **Keyword rules** for flexible request capture with validation
- Export events as JSON or CSV (disabled when no events)
- Dark mode (light / dark / system)
- Auto-scroll to new events
- Empty parameter hiding in event detail
- Settings sync between popup and DevTools
- 38 unit tests for parsers
- Privacy Policy, CODEOWNERS, branch protection
