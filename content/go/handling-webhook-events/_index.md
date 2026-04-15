+++
title = "Handling Webhook events"
weight = 64
+++

Repsy allows you to receive webhook notifications whenever specific Go module repository events occur, such as new module deployments. These webhooks let you automate workflows, sync data, or trigger custom logic in your system.

This guide explains how to configure, receive, and verify webhook events securely.

{{< steps >}}

### What is a Webhook Event?

A webhook is an HTTP POST request sent by Repsy to a URL you define when a specific event happens. Webhook events are delivered as JSON payloads.

#### Example Payload

```json
{
  "event_id": "3a7f1c92-84de-4b10-bcf3-9e2d5a701f44",
  "event_type": "module.deployed",
  "webhook_url": "https://webhook.site/084cfab7-cd5b-4ed3-affa-5d394b635e1e",
  "date": "2025-07-21T14:35:12.304812543Z",
  "module": {
    "uuid": "c2d41e87-9a3b-4f72-b610-e1fc83a220d5",
    "module_path": "corp.internal/mymodule",
    "created_at": "2025-07-21T14:35:12.287643Z",
    "repo": {
      "uuid": "a94f3bc1-2d7e-4501-b823-f6e09d1c83a7",
      "owner": "owner",
      "name": "go",
      "description": null,
      "private_repo": true,
      "searchable": false,
      "created_at": "2025-07-21T11:46:45.242642Z"
    },
    "version": {
      "uuid": "78b20e4a-1f63-4d09-a751-3c5b9e8f017c",
      "version": "v1.0.0",
      "go_version": "1.21",
      "mod_hash": "h1:abc123...",
      "zip_hash": "h1:def456...",
      "created_at": "2025-07-21T14:35:12.291038Z"
    }
  }
}
```

### Event Types

* `module.deployed`: Triggered when a new Go module version is successfully deployed to a Repsy Go repository.

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
