+++
title = "Exit Codes"
weight = 50
description = "The exit codes of the rp command line client: success, general error, usage error, authentication error and scan threshold."
+++

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

## Error output

A failed command reports the error once. With `--output json` the error goes to standard output as an object `{"error": {status, code, title, detail, traceId, hint, errors}}`; otherwise it goes to standard error as `Error: <detail> (code: <code>, trace: <trace>)`, with an optional `Hint:` line. Quote the trace id when you report a problem.
