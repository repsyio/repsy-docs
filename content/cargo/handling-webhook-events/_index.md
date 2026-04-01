+++
title = "Handling Webhook events"
weight = 64
+++

Repsy allows you to receive webhook notifications whenever specific Cargo registry events occur, such as new crate deployments. These webhooks let you automate workflows, sync data, or trigger custom logic in your system.

This guide explains how to configure, receive, and verify webhook events securely.

{{< steps >}}

### What is a Webhook Event?

A webhook is an HTTP POST request sent by Repsy to a URL you define when a specific event happens. Webhook events are delivered as JSON payloads.

#### Example Payload

```json
{
  "event_id": "f4a1b9cc-3c72-4f2f-8c20-e35aaf904992",
  "event_type": "crate.deployed",
  "webhook_url": "https://webhook.site/084cfab7-cd5b-4ed3-affa-5d394b635e1e",
  "date": "2026-03-25T10:20:45.125Z",
  "crate": {
    "uuid": "8f20a9f0-cc41-49eb-b8b9-f4f8e3f6f53e",
    "name": "hello_repsy",
    "created_at": "2026-03-25T10:20:44.998Z",
    "registry": {
      "uuid": "b6e4b5ec-3af1-4b0f-9779-947dcc4a70b6",
      "owner": "owner",
      "name": "cargo",
      "description": null,
      "searchable": false,
      "private_registry": true,
      "created_at": "2026-03-20T08:14:07.232Z"
    },
    "version": {
      "uuid": "dba0f57f-1a08-45ea-9b1d-20f3d2a3e677",
      "version": "0.1.0",
      "metadata": {
        "description": "Example crate for Repsy",
        "license": "MIT",
        "repository": "https://github.com/example/hello_repsy"
      },
      "created_at": "2026-03-25T10:20:45.011Z"
    }
  }
}
```

### Event Types

* `crate.deployed`: Triggered when a new crate version is successfully deployed to a Repsy Cargo registry.

### Authenticating Webhook Events

To ensure webhook authenticity, Repsy signs every request using an HMAC SHA-256 signature with your shared secret key.

Two custom headers are sent with each request:

* `X-Repsy-Signature`: A Base64-encoded HMAC SHA-256 signature of the request. You can use this to verify the authenticity of the webhook.
* `X-Repsy-Timestamp`: The ISO 8601 UTC timestamp indicating when the event was triggered.

You should reject requests if:

* The timestamp is older than a few minutes (to prevent replay attacks).
* The signature does not match.

### Security Best Practices

* Use HTTPS for your webhook URL.
* You should verify the request by recalculating the signature
* Validate the timestamp and signature.
* To prevent duplicate processing, always use the `event_id` to ensure idempotency.
* Log received events for auditing and debugging.

{{< /steps >}}

### Example Integration

Example Endpoint:

{{< code-tabs
java="content/webhook/codes/java/webhook-endpoint.md"
csharp="content/webhook/codes/csharp/webhook-endpoint.md"
javascript="content/webhook/codes/javascript/webhook-endpoint.md" >}}

Example Validation Method:

{{< code-tabs
java="content/webhook/codes/java/validation-method.md"
javascript="content/webhook/codes/javascript/validation-method.md" >}}

### Need Help?

Reach out to [support@repsy.io](mailto:support@repsy.io) if you need help integrating or testing webhooks.
