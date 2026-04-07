# Changelog

All notable changes to TrackSight will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-04-07

### Added

- Real-time interception of analytics events (fetch, XHR, beacon, pixel)
- **Dashboard view** with tracker overview cards showing tracking IDs, event counts, and top events
- **Events view** with grouped event list, search, and tracker filtering
- **Event detail** with parsed parameters and raw request data
- **DevTools panel** with full feature parity to the popup
- Support for **18 built-in trackers**:
  - Google Analytics 4, Google Universal Analytics, Google Tag Manager
  - Facebook Pixel, TikTok Pixel, Snap Pixel, Pinterest Tag
  - Segment, Amplitude, Mixpanel, PostHog, Heap
  - Hotjar, Yandex Metrica, Plausible, RudderStack
  - LinkedIn Insight Tag
- **Custom trackers** via URL pattern matching
- **Keyword rules** for flexible request capture
- Export events as JSON or CSV
- Dark mode (light / dark / system)
- Bilingual UI (English / Russian)
