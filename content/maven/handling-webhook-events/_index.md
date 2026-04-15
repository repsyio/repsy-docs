+++
title = "Handling Webhook events"
weight = 25
+++

Repsy allows you to receive webhook notifications whenever specific Maven repository events occur, such as new artifact deployments. These webhooks let you automate workflows, sync data, or trigger custom logic in your system.

This guide explains how to configure, receive, and verify webhook events securely.

{{< steps >}}

### What is a Webhook Event?

A webhook is an HTTP POST request sent by Repsy to a URL you define when a specific event happens. Webhook events are delivered as JSON payloads.

#### Example Payload

```json
{
  "event_id": "3bc54d4e-47b2-490d-8f2a-6973c30bc773",
  "event_type": "artifact.deployed",
  "webhook_url": "https://webhook.site/084cfab7-cd5b-4ed3-affa-5d394b635e1e",
  "date": "2025-07-21T11:53:43.414706844Z",
  "artifact": {
    "uuid": "e7a2fe3e-5950-4782-801f-49e35814817f",
    "metadata": {
      "plugin": false,
      "group_name": "io.repsy.war_nosnapshot",
      "prefix": null,
      "name": "nosnapshot Maven Webapp",
      "packaging": "war"
    },
    "name": "nosnapshot",
    "created_at": "2025-07-21T11:53:43.345355221Z",
    "last_updated_at": "2025-07-21T11:53:43.345357643Z",
    "repository": {
      "uuid": "74626c11-4abe-4df1-b007-f402958b21b5",
      "owner": "owner",
      "name": "maven",
      "description": null,
      "searchable": false,
      "metadata": {
        "snapshots": true,
        "releases": true
      },
      "private_repo": true,
      "created_at": "2025-07-21T11:46:45.006108Z"
    },
    "version": {
      "uuid": "e2f2fcfd-7102-40b5-97b8-f01f3734b637",
      "description": null,
      "latest": null,
      "release": null,
      "metadata": {
        "scm_url": "",
        "developers": [],
        "prefix": null,
        "packaging": "war",
        "type": "RELEASE",
        "url": "http://maven.apache.org",
        "pomFile": null,
        "source_code_url": "",
        "has_modules": false,
        "licenses": [],
        "has_sources": false,
        "organization": "",
        "has_documents": false,
        "name": "nosnapshot Maven Webapp"
      },
      "name": "2025.07.21-1753098807423",
      "created_at": "2025-07-21T11:53:43.348303489Z",
      "last_updated_at": "2025-07-21T11:53:43.348306115Z"
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
* To prevent duplicate processing, always use the `event_id` to ensure idempotency.
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
