+++
title = "Handling Webhook Events"
weight = 94
+++

Repsy allows you to receive webhook notifications whenever specific Ruby repository events occur, such as new gem deployments. These webhooks let you automate workflows, sync data, or trigger custom logic in your system.

This guide explains how to configure, receive, and verify webhook events securely.

{{< steps >}}

### What is a Webhook Event?

A webhook is an HTTP POST request sent by Repsy to a URL you define when a specific event happens. Webhook events are delivered as JSON payloads.

#### Example Payload

```json
{
  "rubyGem": {
    "uuid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "my_gem",
    "version": "1.0.0",
    "platform": "ruby",
    "published_at": "2026-06-24T10:00:00.000000Z",
    "description": "A sample gem published to Repsy.",
    "authors": "Your Name",
    "homepage": null,
    "license": "MIT",
    "registry": {
      "uuid": "b84af809-132a-4fc9-a0ba-f1fa7d83104a",
      "owner": "repsy",
      "name": "ruby-webhook-12345678",
      "description": null,
      "private_repo": false,
      "searchable": false,
      "created_at": "2026-06-24T09:59:55.000000Z",
      "metadata": null
    }
  },
  "date": "2026-06-24T10:00:00.001000Z",
  "event_id": "c3d4e5f6-a7b8-9012-cdef-ab3456789012",
  "event_type": "package.deployed",
  "repoType": "RUBY",
  "webhook_url": "https://example.com"
}
```

### Event Types

* `package.deployed`: Triggered when a new gem version is successfully deployed to a Repsy Ruby repository.

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
* To prevent duplicate processing, always use the `event_id` to ensure idempotency.
* Log received events for auditing and debugging.

{{< /steps >}}

### Need Help?

Reach out to [support@repsy.io](mailto:support@repsy.io) if you need help integrating or testing webhooks.
