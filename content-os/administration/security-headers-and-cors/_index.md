+++
title = "Security Headers and CORS"
weight = 163
description = "Configure the Content-Security-Policy header, the cross-origin (CORS) rules and HSTS, and see which security headers Repsy sends on which port."
+++

# Security Headers and CORS

Two settings decide what a browser may do with the Repsy web UI: the `Content-Security-Policy` header that Repsy sends
with the web UI, and the cross-origin (CORS) rules of its API. Repsy also sends a few fixed security headers and, if you
ask for it, `Strict-Transport-Security`, see [Other security headers](#other-security-headers). Package managers such as
Maven, npm and Docker are not browsers, so these settings do not affect them.

## Content Security Policy

Repsy sends a `Content-Security-Policy` header with the web UI: its pages and its static files (scripts, styles,
`index.html`). The header tells the browser which sources it may load scripts, styles, images and fonts from, and where
the page may connect to. It is not sent with the JSON answers of the API (paths that start with `/api/`) or on the
package port.

The built-in policy is:

```text
default-src 'self';
script-src 'self' https://www.googletagmanager.com;
style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com;
font-src 'self' https://cdnjs.cloudflare.com data:;
img-src 'self' data: https://www.googletagmanager.com https://www.google-analytics.com;
connect-src 'self' https://www.googletagmanager.com https://www.google-analytics.com <allowed origins>;
object-src 'none';
base-uri 'self';
frame-ancestors 'none';
form-action 'self';
```

Repsy sends it as one line. `<allowed origins>` stands for the origins you list in `APP_ALLOWED_ORIGINS`, see
[Cross-origin requests](#cross-origin-requests-cors).

Two things in the policy are worth knowing:

- **External hosts.** The policy allows `cdnjs.cloudflare.com`, `www.googletagmanager.com` and
  `www.google-analytics.com`, because the web UI of this release loads content from them: an icon stylesheet and fonts
  from cdnjs, and analytics scripts from Google. The requests come from the browser of whoever opens the web UI. If your
  security or privacy rules do not allow them, set your own policy as described below.
- **`frame-ancestors 'none'`.** No other site can show the web UI in a frame or an `<iframe>`.

### Settings

| Variable | Default | Meaning |
| --- | --- | --- |
| `APP_CSP_ENABLED` | `true` | Send the header. Set it to `false` if a reverse proxy in front of Repsy already sends its own policy. |
| `APP_CSP_REPORT_ONLY` | `false` | Send `Content-Security-Policy-Report-Only` instead. The browser reports violations but blocks nothing. Use it to try a new policy. |
| `APP_CSP_POLICY` | empty | Replaces the built-in policy completely. Empty keeps the built-in policy. |

`APP_CSP_POLICY` replaces the whole policy, not a single directive. Start from the built-in policy above, change the part
you need, and pass the result as one line. For example, to let a portal at `https://portal.example.com` embed the web UI:

```bash
-e APP_CSP_POLICY="default-src 'self'; script-src 'self' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; font-src 'self' https://cdnjs.cloudflare.com data:; img-src 'self' data: https://www.googletagmanager.com https://www.google-analytics.com; connect-src 'self' https://www.googletagmanager.com https://www.google-analytics.com; object-src 'none'; base-uri 'self'; frame-ancestors https://portal.example.com; form-action 'self'"
```

A custom policy does not add `APP_ALLOWED_ORIGINS` to `connect-src` for you. If you use both settings, put the origins
into your policy too.

To check what Repsy sends, ask for the web UI and look at the header:

```bash
curl -sI https://repsy.example.com/ | grep -i content-security-policy
```

Test a stricter policy first with `APP_CSP_REPORT_ONLY=true`, open the web UI, and look at the browser console for
violation messages before you enforce it. A policy that is too strict makes parts of the web UI stop working.

## Cross-origin requests (CORS)

Browsers only let a web page call an API on another origin (another scheme, host or port) when that API allows it. The
web UI normally calls the API on the same origin it was loaded from, and then CORS plays no role. It matters when:

- you serve the web UI and the API from different host names (see [`API_BASE_URL`](../running-behind-a-reverse-proxy/#tell-repsy-its-public-addresses)), or
- you want to limit which sites may call your API from a browser.

### Settings

| Variable | Default | Meaning |
| --- | --- | --- |
| `APP_ALLOWED_ORIGINS` | empty | Comma-separated list of the origins allowed to call Repsy with credentials from a browser. Empty allows any origin. |

With the variable empty, Repsy answers a browser preflight request from any origin and allows credentials. Once you set
it, only the listed origins are accepted, and a request from any other origin is answered with `403 Invalid CORS
request`. Rules for the list:

- Write exact origins: scheme, host and port if it is not the default one, without a path or a trailing slash, for
  example `https://repsy.example.com`. Wildcards are not supported.
- Separate several origins with commas. Spaces around the commas are ignored.
- The rule applies to the port of the web UI and its API (`8080` by default) only. The package port (`9090` by default),
  which Maven, npm, Docker and the other package managers use, sends no CORS headers at all, whatever this variable says:
  no browser calls it across origins, and package managers do not send an `Origin` header.

### Serving the web UI and the API from different hosts

Suppose the web UI is served at `https://panel.example.com` and its API at `https://api.example.com`, both by the same
Repsy instance. Set these variables:

```bash
-e API_BASE_URL=https://api.example.com \
-e APP_ALLOWED_ORIGINS=https://panel.example.com,https://api.example.com
```

`API_BASE_URL` makes the web UI call the other host. The browser then sends the origin of the web UI
(`https://panel.example.com`), which the CORS rule must allow, and the CSP must let the page connect to the API host.
The built-in policy adds every origin of `APP_ALLOWED_ORIGINS` to `connect-src`, so listing both origins covers both
needs.

Check the CORS answer for an allowed and a disallowed origin:

```bash
curl -si -X OPTIONS https://api.example.com/ \
  -H "Origin: https://panel.example.com" \
  -H "Access-Control-Request-Method: GET" | grep -i "^HTTP\|access-control-allow-origin"
```

The first call answers `200` with `Access-Control-Allow-Origin: https://panel.example.com`. The same call with any other
`Origin` answers `403`.

## Other security headers

Repsy sends these headers besides the Content Security Policy:

| Header | Where |
| --- | --- |
| `X-Content-Type-Options: nosniff` | Every response, on both ports. The package port serves files that users uploaded. |
| `Referrer-Policy: strict-origin-when-cross-origin` | Every response on the port of the web UI and its API. |
| `X-Frame-Options: DENY` | Every response on the port of the web UI and its API. It does the same as `frame-ancestors 'none'` in the Content Security Policy, for browsers that ignore that directive. |
| `Strict-Transport-Security` | Only when you set `APP_HSTS_MAX_AGE` to a positive number, and only on a secure request, see below. |

### HSTS

| Variable | Default | Meaning |
| --- | --- | --- |
| `APP_HSTS_MAX_AGE` | `0` | The `max-age` in seconds of the `Strict-Transport-Security` header. `0` never sends it. |

With a positive value, Repsy sends `Strict-Transport-Security: max-age=<value>` on both ports, but only on a secure request:
one that arrives on an HTTPS port of Repsy (see [Enabling HTTPS](../enabling-https/)), or through a reverse proxy that sends
`X-Forwarded-Proto: https` (see [Running Behind a Reverse Proxy](../running-behind-a-reverse-proxy/)).

HSTS is off by default because a browser applies it to a whole host, not to one port. A browser that has seen the header
for a host also upgrades `http://<host>:8080` to HTTPS, which breaks a setup that serves the panel over plain HTTP on
`8080` and over HTTPS on `8443` of the same host. Set it when everything on the host is served over HTTPS only. A reverse
proxy in front of Repsy normally sends HSTS itself, and then you need no setting here.

To check what Repsy sends, look at the headers of an answer:

```bash
curl -sI https://repsy.example.com/ | grep -i "x-content-type-options\|referrer-policy\|x-frame-options\|strict-transport-security"
```
