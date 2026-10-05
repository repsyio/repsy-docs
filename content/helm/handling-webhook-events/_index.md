+++
title = "Handling Webhook Events"
weight = 940
description = "Receive webhook notifications when a Helm chart is deployed, and verify each request with its HMAC SHA-256 signature."
+++

Repsy allows you to receive webhook notifications whenever specific Helm chart repository events occur, such as new chart deployments. These webhooks let you automate workflows, sync data, or trigger custom logic in your system.

This guide explains how to configure, receive, and verify webhook events securely.

**Note:** Webhook payload field names are camelCase (for example `eventId`, `eventType`, `webhookUrl`, `createdAt`). Events sent before 2026-10-05 used snake_case names (`event_id`, `event_type`, `webhook_url`, `created_at`); update your receiver if it reads the old names.

{{< steps >}}

### What is a Webhook Event?

A webhook is an HTTP POST request sent by Repsy to a URL you define when a specific event happens. Webhook events are delivered as JSON payloads.

#### Example Payload

```json
{
  "eventId": "0e3ce46d-98db-42a8-b9f4-6be52ceee0eb",
  "eventType": "chart.deployed",
  "webhookUrl": "https://webhook.site/084cfab7-cd5b-4ed3-affa-5d394b635e1e",
  "date": "2025-07-21T12:01:03.525814226Z",
  "repoType": "HELM",
  "chart": {
    "uuid": "b91c4d72-3e5f-4a10-b234-7e8f9c0d1a2b",
    "name": "my-chart",
    "version": "1.0.0",
    "createdAt": "2025-11-14T09:22:05.100000Z",
    "description": "A Helm chart for Kubernetes",
    "appVersion": "2.1.0",
    "type": "application",
    "digest": "sha256:3f1b8e0c5a7d9b24e6f0a1c3d5e7f9a1b2c4d6e8f0a2b4c6d8e0f1a3b5c7d9e1",
    "registry": {
      "uuid": "064a1f9d-af9f-4cb0-8875-12b739a5fb88",
      "owner": "owner",
      "name": "helm",
      "description": null,
      "privateRepo": true,
      "createdAt": "2025-07-21T11:46:45.242642Z",
      "metadata": null
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
* To prevent duplicate processing, always use the `eventId` to ensure idempotency.
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
