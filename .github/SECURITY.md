# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in TrackSight, please report it responsibly:

1. **Do not** open a public issue
2. Email the details to the repository owner or open a private security advisory via [GitHub Security Advisories](https://github.com/ComsiComsa/TrackSight/security/advisories/new)
3. Include steps to reproduce, affected versions, and potential impact

We will respond within 48 hours and work on a fix promptly.

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | Yes       |

## Scope

TrackSight runs entirely in the browser with zero external communication. Security concerns include:
- Content script injection vulnerabilities
- Message passing between extension contexts
- Data exposure through exports
- Extension fingerprinting
