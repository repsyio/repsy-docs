+++
title = "Handling Webhook Events"
weight = 1040
description = "Receive webhook notifications when a Ruby gem is deployed, and verify each request with its HMAC SHA-256 signature."
+++

Repsy allows you to receive webhook notifications whenever specific Ruby repository events occur, such as new gem deployments. These webhooks let you automate workflows, sync data, or trigger custom logic in your system.

This guide explains how to configure, receive, and verify webhook events securely.

**Note:** Webhook payload field names are camelCase (for example `eventId`, `eventType`, `webhookUrl`, `createdAt`). Events sent before 2026-10-05 used snake_case names (`event_id`, `event_type`, `webhook_url`, `created_at`); update your receiver if it reads the old names.

{{< steps >}}

### What is a Webhook Event?

A webhook is an HTTP POST request sent by Repsy to a URL you define when a specific event happens. Webhook events are delivered as JSON payloads.

#### Example Payload

```json
{
  "eventId": "0e3ce46d-98db-42a8-b9f4-6be52ceee0eb",
  "eventType": "gem.deployed",
  "webhookUrl": "https://webhook.site/084cfab7-cd5b-4ed3-affa-5d394b635e1e",
  "date": "2025-07-21T12:01:03.525814226Z",
  "repoType": "RUBY",
  "gem": {
    "name": "my_gem",
    "version": "1.0.0",
    "platform": "ruby",
    "createdAt": "2026-06-24T10:00:00.000000Z",
    "registry": {
      "uuid": "064a1f9d-af9f-4cb0-8875-12b739a5fb88",
      "owner": "owner",
      "name": "ruby",
      "description": null,
      "privateRepo": true,
      "createdAt": "2025-07-21T11:46:45.242642Z",
      "metadata": null
    }
  }
}
```

### Event Types

* `gem.deployed`: Triggered when a new gem version is successfully deployed to a Repsy Ruby repository.

### Authenticating Webhook Events

To ensure webhook authenticity, Repsy signs every request using an HMAC SHA-256 signature with your shared secret key.

Two custom headers are sent with each request:

* `X-Repsy-Signature`: A Base64-encoded HMAC SHA-256 signature. The signed data is `{X-Repsy-Timestamp}.{raw JSON body}` — concatenate the timestamp header value, a literal `.`, and the raw request body, then HMAC-SHA256 with your Base64 URL-decoded secret key.
* `X-Repsy-Timestamp`: The ISO 8601 UTC timestamp indicating when the event was triggered.

You should reject requests if:

* The timestamp is older than a few minutes (to prevent replay attacks).
* The signature does not match.

### Security Best Practices

* Use HTTPS for your webhook URL.
* Verify the request by recalculating the signature.
* Validate the timestamp and signature.
* To prevent duplicate processing, always use the `eventId` to ensure idempotency.
* Log received events for auditing and debugging.

{{< /steps >}}

### Need Help?

Reach out to [support@repsy.io](mailto:support@repsy.io) if you need help integrating or testing webhooks.
