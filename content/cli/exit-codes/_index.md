+++
title = "Exit Codes"
weight = 50
description = "The exit codes of the rp command line client: success, general error, usage error, authentication error and scan threshold."
+++

# Exit Codes

`rp` exits with one of these codes, so scripts can tell the failures apart.

| Code | Meaning |
| --- | --- |
| 0 | Success. |
| 1 | Any other error, including an HTTP error answer such as 403 or a failed check of `rp profile doctor`. |
| 2 | Usage error (wrong arguments or flags), or a command or feature the selected host does not support. |
| 4 | Authentication error: the credentials are missing or were rejected (HTTP 401). |
| 5 | A security scan reached the severity threshold set for the command. |

When one failure carries several of these, the order of precedence is 5, 4, 2, 1.

## Why 403 is exit code 1

An HTTP 403 means the credentials are valid but not allowed to do the thing. Logging in again would not help, so it is a general error (1) and not an authentication error (4).

## Requests that would get the IP address banned

Repsy bans an IP address for an hour when its requests look like an attack, for example script or SQL text in a search, or `..` in a path (the probe ban of Repsy Open Source, on by default there). Since `rp` 0.2.3 every command checks each request against the same rules before it is sent, and refuses one that the server would count, with a usage error (exit code 2) that names the rule:

```text
$ rp repo list --search '<script>alert(1)</script>'
Error: rp did not send this request: the server's probe ban would count it as xss and ban this IP address after a few such requests; change the name, path or search text that put it there (GET /api/repos)
```

`rp api` is the exception: it sends the request it is given.

## A Repsy Open Source server that is too old

`rp` needs Repsy Open Source 26.11.0 or newer. An older server is refused before any other request, with exit code 2 and the code `notSupported`, naming the server's version (or "older than 26.11.0" when the server has no `GET /api/info`) and the minimum:

```text
$ rp repo list
Error: the Repsy OS server at repsy.example.com is version 26.10.0; rp needs Repsy OS 26.11.0 or newer
Hint: Upgrade the Repsy OS server to 26.11.0 or newer (https://github.com/repsyio/repsy/releases). The next command checks the version again, so nothing needs to be reset after the upgrade.
```

Repsy Cloud is not checked.

## Error output

A failed command reports the error once. With `--output json` the error goes to standard output as an object `{"error": {status, code, title, detail, traceId, hint, errors}}`; otherwise it goes to standard error as `Error: <detail> (code: <code>, trace: <trace>)`, with an optional `Hint:` line. Quote the trace id when you report a problem.

Every member of the JSON object is always present. `status` is the HTTP status of the answer, or 0 when the error did not come from the server. For an error from the server, `code` and `title` are the server's. For an error of `rp` itself (`status` 0), they name its kind:

| `code` | `title` | Exit code |
| --- | --- | --- |
| `usageError` | Usage error | 2 |
| `notSupported` | Not supported | 2 |
| `authRequired` | Authentication required | 4 |
| `scanThreshold` | Scan threshold exceeded | 5 |

Any other error of `rp` itself, such as a network failure, has an empty `code` and exits with 1. To tell an error of `rp` from one of the server, test `status == 0`. Before `rp` 0.1.6 the `code` of an error of `rp` itself was always empty.
