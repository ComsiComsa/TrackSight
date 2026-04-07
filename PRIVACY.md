# Privacy Policy for TrackSight

**Last updated:** April 7, 2026

## Overview

TrackSight is a browser extension that helps developers and marketers inspect analytics events fired by websites in real-time. It operates entirely within your browser and does not collect, store, or transmit any personal data.

## Data Collection

**TrackSight does not collect any data.** Specifically:

- No personal information is collected
- No browsing history is recorded or stored
- No data is sent to external servers
- No cookies are set by the extension
- No analytics or tracking is performed by the extension itself

## How TrackSight Works

TrackSight intercepts network requests made by analytics trackers (such as Google Analytics, Facebook Pixel, etc.) on the pages you visit. This data is:

- Processed **entirely locally** within your browser
- Stored **only in memory** for the duration of the browser tab session
- **Automatically discarded** when you close the tab or clear events
- **Never transmitted** outside your browser

## Permissions Explained

| Permission | Why it's needed |
|---|---|
| `webRequest` | To detect analytics network requests on the current page |
| `activeTab` | To associate detected events with the active browser tab |
| `tabs` | To display events per tab and manage the extension popup |
| `storage` | To save your extension preferences (theme, language, custom tracker rules) locally |
| `<all_urls>` | To detect analytics trackers on any website you visit |

## Data Storage

The only data stored persistently is your extension settings (theme preference, language, and custom tracker configurations). This data is stored locally using Chrome's `chrome.storage.local` API and is never transmitted externally.

## Third-Party Services

TrackSight does not integrate with, send data to, or receive data from any third-party services, APIs, or servers.

## Children's Privacy

TrackSight does not collect any data from any users, including children under 13.

## Changes to This Policy

If this privacy policy is updated, changes will be noted in this document with an updated revision date.

## Contact

If you have questions about this privacy policy, please open an issue on our [GitHub repository](https://github.com/ComsiComsa/TrackSight).

## Open Source

TrackSight is open-source software licensed under the MIT License. You can review the complete source code to verify these privacy claims.
