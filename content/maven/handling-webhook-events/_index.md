+++
title = "Handling Webhook Events"
weight = 350
description = "Receive webhook notifications when a Maven artifact is deployed, and verify each request with its HMAC SHA-256 signature."
+++

Repsy allows you to receive webhook notifications whenever specific Maven repository events occur, such as new artifact deployments. These webhooks let you automate workflows, sync data, or trigger custom logic in your system.

This guide explains how to configure, receive, and verify webhook events securely.

**Note:** Webhook payload field names are camelCase (for example `eventId`, `eventType`, `webhookUrl`, `createdAt`). Events sent before 2026-10-05 used snake_case names (`event_id`, `event_type`, `webhook_url`, `created_at`); update your receiver if it reads the old names.

{{< steps >}}

### What is a Webhook Event?

A webhook is an HTTP POST request sent by Repsy to a URL you define when a specific event happens. Webhook events are delivered as JSON payloads.

#### Example Payload

```json
{
  "eventId": "0e3ce46d-98db-42a8-b9f4-6be52ceee0eb",
  "eventType": "artifact.deployed",
  "webhookUrl": "https://webhook.site/084cfab7-cd5b-4ed3-affa-5d394b635e1e",
  "date": "2025-07-21T12:01:03.525814226Z",
  "repoType": "MAVEN",
  "artifact": {
    "uuid": "e7a2fe3e-5950-4782-801f-49e35814817f",
    "name": "nosnapshot",
    "createdAt": "2025-07-21T11:53:43.345355221Z",
    "lastUpdatedAt": "2025-07-21T11:53:43.345357643Z",
    "repository": {
      "uuid": "064a1f9d-af9f-4cb0-8875-12b739a5fb88",
      "owner": "owner",
      "name": "maven",
      "description": null,
      "privateRepo": true,
      "createdAt": "2025-07-21T11:46:45.242642Z",
      "metadata": {
        "snapshots": true,
        "releases": true
      }
    },
    "version": {
      "uuid": "e2f2fcfd-7102-40b5-97b8-f01f3734b637",
      "name": "2025.07.21-1753098807423",
      "description": null,
      "createdAt": "2025-07-21T11:53:43.348303489Z",
      "lastUpdatedAt": "2025-07-21T11:53:43.348306115Z",
      "metadata": {
        "type": "RELEASE",
        "organization": "",
        "name": "nosnapshot Maven Webapp",
        "packaging": "war",
        "licenses": [],
        "developers": [],
        "pomFile": null,
        "prefix": null,
        "hasDocuments": false,
        "hasModules": false,
        "hasSources": false,
        "sourceCodeUrl": "",
        "scmUrl": "",
        "url": "http://maven.apache.org"
      }
    },
    "metadata": {
      "groupName": "io.repsy.war_nosnapshot",
      "name": "nosnapshot Maven Webapp",
      "packaging": "war",
      "plugin": false,
      "prefix": null
    }
  }
}
```

### Event Types

* `artifact.deployed`: Triggered when a new artifact is successfully deployed to a Repsy Maven repository.

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
