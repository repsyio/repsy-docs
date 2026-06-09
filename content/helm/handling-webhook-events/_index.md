+++
title = "Handling Webhook Events"
weight = 84
+++

Repsy allows you to receive webhook notifications whenever specific Helm chart repository events occur, such as new chart deployments. These webhooks let you automate workflows, sync data, or trigger custom logic in your system.

This guide explains how to configure, receive, and verify webhook events securely.

{{< steps >}}

### What is a Webhook Event?

A webhook is an HTTP POST request sent by Repsy to a URL you define when a specific event happens. Webhook events are delivered as JSON payloads.

#### Example Payload

```json
{
  "event_id": "7d4e9c31-12ab-4f56-8910-bc3d2e7f0a11",
  "event_type": "chart.deployed",
  "webhook_url": "https://webhook.site/084cfab7-cd5b-4ed3-affa-5d394b635e1e",
  "date": "2025-11-14T09:22:05.123456789Z",
  "chart": {
    "uuid": "b91c4d72-3e5f-4a10-b234-7e8f9c0d1a2b",
    "name": "my-chart",
    "version": "1.0.0",
    "app_version": "2.1.0",
    "created_at": "2025-11-14T09:22:05.100000Z",
    "repo": {
      "uuid": "c03d5e84-4f6a-5b21-c345-8f9a0d1e2b3c",
      "owner": "owner",
      "name": "helm",
      "description": null,
      "private_repo": true,
      "searchable": false,
      "created_at": "2025-11-14T08:00:00.000000Z"
    }
  }
}
```

### Event Types

* `chart.deployed`: Triggered when a new Helm chart version is successfully deployed to a Repsy Helm repository.

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
java="files/webhook/codes/java/helm-chart.md"
csharp="files/webhook/codes/csharp/helm-chart.md"
javascript="files/webhook/codes/javascript/helm-chart.md" >}}

Example Validation Method:

{{< code-tabs
java="files/webhook/codes/java/validation-method.md"
javascript="files/webhook/codes/javascript/validation-method.md" >}}

### Need Help?

Reach out to [support@repsy.io](mailto:support@repsy.io) if you need help integrating or testing webhooks.
