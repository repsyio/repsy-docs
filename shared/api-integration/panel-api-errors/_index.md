+++
title = "Panel API Errors"
weight = 1110
description = "Read the error documents of the panel API: problem+json fields, status codes, stable error codes, Retry-After and the bodies of the package routes."
+++

# Panel API Errors

The panel API is the set of `/api/...` routes that the web UI calls. A script can call it too, with the access token that
`POST /api/auth/login` returns (`Authorization: Bearer <token>`). This page describes what it answers when a request
fails, and how a success looks. The wire protocols of the package formats (Maven, npm, Docker and so on) are a different
thing: they keep the error format their own client expects, see [The Package Routes](#the-package-routes). The panel API is
in beta and can change.

## Successful Answers

A success is the bare resource, with no wrapper around it:

| Request | Answer |
| --- | --- |
| Read, update, action that returns something | `200` and the resource. A list is a page: `content` and `page` (`size`, `number`, `totalElements`, `totalPages`). |
| Create | `201`, the new resource and a `Location` header that points to it. |
| Delete, or an update with nothing to return | `204` and no body. Deleting something that is not there is `404`. |
| Work that finishes later (for example starting a scan) | `202`, no body and a `Location` header that points to a status resource. |

An answer that carries a secret (login, a new or rotated deploy token, a password reset) has `Cache-Control: no-store`.

{{< product "os" >}}
Two groups of routes still answer the older wrapper `{"msgId": "...", "type": "SUCCESS", "text": "...", "errorCode": null, "data": ...}`
on success, and the resource is in `data`: `/api/auth/...` (login, token refresh) and `/api/users/...`. They move to the bare
form later. Failures are always the error document below.
{{< /product >}}
{{< product "cloud" >}}
A few routes still answer the older wrapper `{"msgId": "...", "type": "SUCCESS", "text": "...", "errorCode": null, "data": ...}`
on success, and the resource is in `data`: the public profile lookups under `/api/repos/lookup/...` and `POST /api/logs/frontend`.
They move to the bare form later. Failures are always the error document below.
{{< /product >}}

## The Error Document

A failed request is answered with `application/problem+json`, a problem document as RFC 9457 defines it:

| Field | Meaning |
| --- | --- |
| `type` | A URI for the kind of problem. It is `about:blank` when there is none. |
| `title` | The HTTP reason phrase of `status`. |
| `status` | The HTTP status, repeated from the response. |
| `detail` | A human readable text for this failure. Show it to a person, do not parse it. |
| `instance` | The request path. |
| `code` | The stable machine key of the failure, for example `validationError` or `itemNotFound`. Switch on this. A code is never renamed or reused. |
| `errors` | Only on a failed validation: a list of `{ "field", "code", "message" }`, one for each field, parameter or header that was refused. `code` there is the constraint (`NotBlank`, `Min`, ...) and `message` a text. |
| `traceId` | A unique id of this one failure (a UUID). Quote it in a bug report, so the failure can be found in the log of the server. |

`code` is what older clients know as `msgId`, and `traceId` is the old `errorCode`; the strings did not change. Do not
confuse `traceId` with `code`.

## Status Codes

| Status | When | Typical `code` |
| --- | --- | --- |
| `400` | A body that cannot be read, a field that fails validation, a bad `page`, `size` or `sort` (`page` is zero based, `size` is 1 to 100, an unknown `sort` property is refused). | `validationError`, `badRequest` |
| `401` | The credential is missing, wrong or expired. The answer has `WWW-Authenticate: Bearer`. | `loginRequired`, `invalidCredentials`, `sessionExpired` |
| `403` | You are signed in, but not allowed to do this. {{< product "cloud" >}}An exceeded plan quota is a `403` too, see [Quotas](#quotas).{{< /product >}} | `accessDenied` |
| `404` | There is no such thing. {{< product "cloud" >}}A private repository that you have no access to answers like one that does not exist, so a stranger cannot tell the difference.{{< /product >}} | `itemNotFound`{{< product "cloud" >}}, `repoNotFound`{{< /product >}} |
| `405` | The path exists, but not for this HTTP method. The `Allow` header lists the methods that work. | `methodNotSupported` |
| `406` | The `Accept` header names no media type the route can produce. | `notAcceptable` |
| `409` | The name is taken, or the state does not allow it (for example a scan that is already running, or two changes of the same item at once). | `itemAlreadyExists`, `concurrentModification` |
| `413` | An upload over the size limit. | `payloadTooLarge` |
| `415` | The body has a content type the route cannot read. The `Accept` header lists the ones it can. | `unsupportedMediaType` |
| `429` | Too many failed attempts, see [Retry-After](#retry-after). | `tooManyRequests` |
| `503` | A database lock could not be taken in time. Repeat the request after the `Retry-After` seconds. | `resourceBusy` |

The set of codes is longer than this table: a route names the thing that failed (`usernameInUse`, `deployTokenNotFound`
and so on). Treat a code you do not know like the status it came with.

{{< product "cloud" >}}
### Quotas

Exceeding the disk or the monthly traffic quota of your plan is `403`, with the `code` `diskUsageExceeded` or
`trafficLimitExceeded`. A limit of the plan on a count of things, such as collaborators, is `403` too: the code is
`collaboratorLimitReached` for collaborators. A quota stops **uploads** only: a request that
stores something new (a version, a file, a layer or a manifest). Downloads, deletes and changes to something that exists
(a dist-tag, a deprecation, an unpublish) are never refused for a quota. A limit of zero means no quota at all, not an
unlimited one. See the pricing page for the limits of a plan.

On the package routes (where an upload happens) the same `403` and the same codes come in the body of that route, see
[The Package Routes](#the-package-routes).
{{< /product >}}

### Retry-After

A `429` and a `503` carry a `Retry-After` header with the number of seconds to wait. `429` is sent when:

- too many failed sign-ins came from one client{{< product "cloud" >}}, or too many wrong second-factor codes{{< /product >}}{{< product "os" >}}, so a script that loops over passwords is slowed down{{< /product >}}.
{{< product "cloud" >}}- a new e-mail one-time code is asked for before the resend cooldown of the previous one is over.
{{< /product >}}
The answer is the same whatever user name or password was sent. Wait for the number of seconds, then try again.

## Examples

Texts in `detail` and `message` are examples: they can be worded differently, and they follow the language of the server.

A failed validation (`400`), with one entry in `errors` for each refused field:

```http
HTTP/1.1 400
Content-Type: application/problem+json

{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "Validation error.",
  "instance": "/api/repos",
  "code": "validationError",
  "errors": [
    { "field": "name", "code": "Pattern", "message": "must match the allowed pattern" }
  ],
  "traceId": "0b5f3a52-7c1e-4f0e-9d0b-3a1c2f6d8e44"
}
```

A missing or wrong credential (`401`):

```http
HTTP/1.1 401
WWW-Authenticate: Bearer
Content-Type: application/problem+json

{
  "type": "about:blank",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Please sign in.",
  "instance": "/api/profile",
  "code": "loginRequired",
  "traceId": "6f0c4a8e-1d52-4b2c-8a7e-5d9a0e3b7c11"
}
```

{{< product "os" >}}
A signed-in user who is not an administrator asks for an administrator route, for example `GET /api/security/scans` (`403`):

```http
HTTP/1.1 403
Content-Type: application/problem+json

{
  "type": "about:blank",
  "title": "Forbidden",
  "status": 403,
  "detail": "Access Denied. Please check your credentials.",
  "instance": "/api/security/scans",
  "code": "accessDenied",
  "traceId": "c2d9a7e4-8b36-47a0-9f1d-0e5b6a4c3d28"
}
```

Repsy Open Source has no plans, so it has no quota errors. Every signed-in user can read and write every repository, so a
`403` on the panel API means an administrator route.
{{< /product >}}
{{< product "cloud" >}}
A signed-in user asks for a private repository of someone else (`404`, the same as for a repository that does not exist):

```http
HTTP/1.1 404
Content-Type: application/problem+json

{
  "type": "about:blank",
  "title": "Not Found",
  "status": 404,
  "detail": "Repository not found.",
  "instance": "/api/repos/some-owner/private-repo/settings",
  "code": "repoNotFound",
  "traceId": "c2d9a7e4-8b36-47a0-9f1d-0e5b6a4c3d28"
}
```

A collaborator who may read a repository, but not manage it, changes its settings (`403`):

```http
HTTP/1.1 403
Content-Type: application/problem+json

{
  "type": "about:blank",
  "title": "Forbidden",
  "status": 403,
  "detail": "Access Denied. Please check your credentials.",
  "instance": "/api/repos/my-owner/my-repo/settings",
  "code": "accessDenied",
  "traceId": "1e8b3c7d-5a42-4d19-b6f0-9c2a7d4e8f35"
}
```

A plan count limit (`403`):

```http
HTTP/1.1 403
Content-Type: application/problem+json

{
  "type": "about:blank",
  "title": "Forbidden",
  "status": 403,
  "detail": "The collaborator limit of the plan is reached.",
  "instance": "/api/repos/my-owner/my-repo/users",
  "code": "collaboratorLimitReached",
  "traceId": "9a4e7c20-3b6d-4f81-a5c9-2d0e8b7f1a63"
}
```
{{< /product >}}

Too many failed sign-ins (`429`):

```http
HTTP/1.1 429
Retry-After: 30
Content-Type: application/problem+json

{
  "type": "about:blank",
  "title": "Too Many Requests",
  "status": 429,
  "detail": "Too many failed authentication attempts. Please try again later.",
  "instance": "/api/auth/login",
  "code": "tooManyRequests",
  "traceId": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
}
```

A wrong method (`405`), with the methods that work in `Allow`:

```http
HTTP/1.1 405
Allow: GET, HEAD, PATCH, DELETE
Content-Type: application/problem+json

{
  "type": "about:blank",
  "title": "Method Not Allowed",
  "status": 405,
  "detail": "The HTTP method is not supported for this route.",
  "instance": "/api/repos/my-repo",
  "code": "methodNotSupported",
  "traceId": "3d1b9f6a-2c47-4e85-8a0b-7f5c6e2d9a14"
}
```

## The Package Routes

The routes that package managers use (`mvn deploy`, `npm publish`, `docker push` and so on) keep the error format of their
own client, not the error document above. For most of them it is a JSON body with the older fields `msgId` (the same key as
`code` above), `type`, `text`, `errorCode` (the same unique id as `traceId` above) and `data`:

```json
{"msgId": "tooManyRequests", "type": "ERROR", "text": "Too many failed authentication attempts. Please try again later.", "errorCode": "f47ac10b-58cc-4372-a567-0e02b2c3d479", "data": null}
```

{{< product "cloud" >}}
The status codes are the ones of the table above, and the codes are the same strings. An upload over a quota is `403` on every
package route, with `msgId` `diskUsageExceeded` or `trafficLimitExceeded`. A Docker client gets the registry error
`DENIED` for it, as the Docker registry API defines.
{{< /product >}}
{{< product "os" >}}
The status codes are the ones of the table above, and the codes are the same strings.
{{< /product >}}
