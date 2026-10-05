+++
title = "Handling Webhook Events"
weight = 440
description = "Receive webhook notifications when a NuGet package is deployed, and verify each request with its HMAC SHA-256 signature."
+++

Repsy allows you to receive webhook notifications whenever specific NuGet repository events occur, such as new package deployments. These webhooks let you automate workflows, sync data, or trigger custom logic in your system.

This guide explains how to configure, receive, and verify webhook events securely.

**Note:** Webhook payload field names are camelCase (for example `eventId`, `eventType`, `webhookUrl`, `createdAt`). Events sent before 2026-10-05 used snake_case names (`event_id`, `event_type`, `webhook_url`, `created_at`); update your receiver if it reads the old names.

{{< steps >}}

### What is a Webhook Event?

A webhook is an HTTP POST request sent by Repsy to a URL you define when a specific event happens. Webhook events are delivered as JSON payloads.

#### Example Payload

```json
{
  "eventId": "0e3ce46d-98db-42a8-b9f4-6be52ceee0eb",
  "eventType": "package.deployed",
  "webhookUrl": "https://webhook.site/084cfab7-cd5b-4ed3-affa-5d394b635e1e",
  "date": "2025-07-21T12:01:03.525814226Z",
  "repoType": "NUGET",
  "nugetPackage": {
    "uuid": "f4750e91-e74f-4392-88e4-069b59dd1fa0",
    "packageId": "repsy.e2e.nuget",
    "version": "1.0.1779172335",
    "publishedAt": "2026-05-19T06:32:19.386212Z",
    "title": null,
    "description": "Repsy NuGet e2e package",
    "authors": "Repsy",
    "tags": "repsy e2e nuget",
    "iconUrl": null,
    "licenseUrl": null,
    "projectUrl": null,
    "repositoryUrl": null,
    "isPrerelease": false,
    "registry": {
      "uuid": "064a1f9d-af9f-4cb0-8875-12b739a5fb88",
      "owner": "owner",
      "name": "nuget",
      "description": null,
      "privateRepo": true,
      "createdAt": "2025-07-21T11:46:45.242642Z",
      "metadata": null
    }
  }
}
```

### Event Types

* `package.deployed`: Triggered when a new NuGet package version is successfully deployed to a Repsy NuGet repository.

### Authenticating Webhook Events

To ensure webhook authenticity, Repsy signs every request using an HMAC SHA-256 signature with your shared secret key.

Two custom headers are sent with each request:

* `X-Repsy-Signature`: A Base64-encoded HMAC SHA-256 signature. The signed data is `{X-Repsy-Timestamp}.{raw JSON body}` — concatenate the timestamp header value, a literal `.`, and the raw request body, then HMAC-SHA256 with your Base64 URL-decoded secret key.
* `X-Repsy-Timestamp`: The ISO 8601 UTC timestamp indicating when the event was triggered.

You should reject requests if:

* The timestamp is older than a few minutes (to prevent replay attacks).
* The signature does not match.

#### Signature Verification Example

```csharp
var timestamp = request.Headers["X-Repsy-Timestamp"];
var signature = request.Headers["X-Repsy-Signature"];
var body = await request.Content.ReadAsStringAsync();

var keyBytes = Base64UrlDecode(secretKey); // URL-safe Base64 decode
var dataToSign = Encoding.UTF8.GetBytes(timestamp + "." + body);
using var hmac = new HMACSHA256(keyBytes);
var expected = Convert.ToBase64String(hmac.ComputeHash(dataToSign));

if (!CryptographicOperations.FixedTimeEquals(
        Encoding.UTF8.GetBytes(expected),
        Encoding.UTF8.GetBytes(signature))) {
    // reject
}
```

### Security Best Practices

* Use HTTPS for your webhook URL.
* Verify the request by recalculating the signature.
* Validate the timestamp and signature.
* To prevent duplicate processing, always use the `eventId` to ensure idempotency.
* Log received events for auditing and debugging.

{{< /steps >}}

### Need Help?

Reach out to [support@repsy.io](mailto:support@repsy.io) if you need help integrating or testing webhooks.
