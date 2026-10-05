+++
title = "Handling Webhook Events"
weight = 640
description = "Receive webhook notifications when a PyPI package is deployed, and verify each request with its HMAC SHA-256 signature."
+++

Repsy allows you to receive webhook notifications whenever specific PyPI repository events occur, such as new package deployments. These webhooks let you automate workflows, sync data, or trigger custom logic in your system.

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
  "repoType": "PYPI",
  "package": {
    "uuid": "1e120ef4-a7ed-40a7-ac5d-4c4b1f3700ec",
    "name": "test-package",
    "createdAt": "2025-07-21T12:02:14.564288Z",
    "repository": {
      "uuid": "064a1f9d-af9f-4cb0-8875-12b739a5fb88",
      "owner": "owner",
      "name": "pypi",
      "description": null,
      "privateRepo": true,
      "createdAt": "2025-07-21T11:46:45.242642Z",
      "metadata": null
    },
    "release": {
      "uuid": "7185497c-a923-47e1-b195-9bea1f28defb",
      "name": "2025.7.21.1753099316751",
      "description": null,
      "finalRelease": true,
      "preRelease": false,
      "postRelease": false,
      "devRelease": false,
      "createdAt": "2025-07-21T12:02:14.582392Z",
      "metadata": {
        "stableVersion": null,
        "summary": "Test package.",
        "homePage": null,
        "author": null,
        "authorEmail": null,
        "license": null,
        "descriptionContentType": null,
        "classifiers": [],
        "projectUrls": []
      }
    },
    "metadata": {
      "normalizedName": "test-package"
    }
  }
}
```

### Event Types

* `package.deployed`: Triggered when a new package is successfully deployed to a Repsy PyPI repository.

### Authenticating Webhook Events

To ensure webhook authenticity, Repsy signs every request using an HMAC SHA-256 signature with your shared secret key.

Two custom headers are sent with each request:

* `X-Repsy-Signature`: A Base64-encoded HMAC SHA-256 signature of the request. You can use this to verify the authenticity of the webhook.
* `X-Repsy-Timestamp`: The ISO 8601 UTC timestamp indicating when the event was triggered.

You should reject requests if:

* The timestamp is older than a few minutes (to prevent replay attacks).
* The signature doesn't match.

### Security Best Practices

* Use HTTPS for your webhook URL.
* You should verify the request by recalculating the signature
* Validate the timestamp and signature.
* To prevent duplicate processing, always use the `eventId` to ensure idempotency.
* Log received events for auditing and debugging.

{{< /steps >}}

### Example Integration

Example Endpoint:

{{< code-tabs
java="files/webhook/codes/java/webhook-endpoint.md"
csharp="files/webhook/codes/csharp/webhook-endpoint.md"
javascript="files/webhook/codes/javascript/webhook-endpoint.md" >}}

Example Validation Method:

{{< code-tabs
java="files/webhook/codes/java/validation-method.md"
javascript="files/webhook/codes/javascript/validation-method.md" >}}

### Need Help?

Reach out to [support@repsy.io](mailto:support@repsy.io) if you need help integrating or testing webhooks.
