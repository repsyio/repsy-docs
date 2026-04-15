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
  "crate": {
    "uuid": "fa3b0ffb-8468-4821-8db2-bd09e814c431",
    "name": "repsy_e2e_platform_dep",
    "version": "2.0.1775591494",
    "created_at": "2026-04-07T10:25:22.380500Z",
    "description": "Repsy e2e platform dependency crate",
    "homepage": null,
    "repository_url": null,
    "license": "MIT",
    "license_file": null,
    "documentation": null,
    "rust_version": null,
    "authors": [],
    "keywords": [],
    "categories": [],
    "registry": {
      "uuid": "087bf481-cf09-421f-94ab-28cd438b59f6",
      "owner": "repsy",
      "name": "cargo",
      "description": null,
      "private_repo": true,
      "searchable": false,
      "created_at": "2026-04-07T10:24:36.565999Z",
      "metadata": null
    }
  },
  "date": "2026-04-07T19:51:35.842454Z",
  "event_id": "baf61626-bca7-4039-b9bf-e30c6d5ec708",
  "event_type": "crate.deployed",
  "repoType": "CARGO",
  "webhook_url": "https://example.com"
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
