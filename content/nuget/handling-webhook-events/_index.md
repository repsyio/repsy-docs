+++
title = "Handling Webhook Events"
weight = 74
+++

Repsy allows you to receive webhook notifications whenever specific NuGet repository events occur, such as new package deployments. These webhooks let you automate workflows, sync data, or trigger custom logic in your system.

This guide explains how to configure, receive, and verify webhook events securely.

{{< steps >}}

### What is a Webhook Event?

A webhook is an HTTP POST request sent by Repsy to a URL you define when a specific event happens. Webhook events are delivered as JSON payloads.

#### Example Payload

```json
{
  "nugetPackage": {
    "uuid": "f4750e91-e74f-4392-88e4-069b59dd1fa0",
    "package_id": "repsy.e2e.nuget",
    "version": "1.0.1779172335",
    "published_at": "2026-05-19T06:32:19.386212Z",
    "title": null,
    "description": "Repsy NuGet e2e package",
    "authors": "Repsy",
    "tags": "repsy e2e nuget",
    "icon_url": null,
    "license_url": null,
    "project_url": null,
    "repository_url": null,
    "is_prerelease": false,
    "registry": {
      "uuid": "b84af809-132a-4fc9-a0ba-f1fa7d83104a",
      "owner": "repsy",
      "name": "nuget-webhook-89109313",
      "description": null,
      "private_repo": false,
      "searchable": false,
      "created_at": "2026-05-19T06:32:15.448993Z",
      "metadata": null
    }
  },
  "date": "2026-05-19T06:32:19.387832Z",
  "event_id": "3bf5bfe2-e38b-41c3-8e7f-fa29660beb08",
  "event_type": "package.deployed",
  "repoType": "NUGET",
  "webhook_url": "https://example.com"
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
* To prevent duplicate processing, always use the `event_id` to ensure idempotency.
* Log received events for auditing and debugging.

{{< /steps >}}

### Need Help?

Reach out to [support@repsy.io](mailto:support@repsy.io) if you need help integrating or testing webhooks.
