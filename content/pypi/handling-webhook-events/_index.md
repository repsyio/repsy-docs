+++
title = "Handling Webhook events"
weight = 44
+++

Repsy allows you to receive webhook notifications whenever specific Pypi repository events occur, such as new package deployments. These webhooks let you automate workflows, sync data, or trigger custom logic in your system.

This guide explains how to configure, receive, and verify webhook events securely.

{{< steps >}}

### What is a Webhook Event?

A webhook is an HTTP POST request sent by Repsy to a URL you define when a specific event happens. Webhook events are delivered as JSON payloads.

#### Example Payload

```json
{
  "event_id": "4d64f286-bcef-4b2c-bd8d-adab5769c10a",
  "event_type": "package.deployed",
  "webhook_url": "https://webhook.site/084cfab7-cd5b-4ed3-affa-5d394b635e1e",
  "date": "2025-07-21T12:02:15.449078537Z",
  "package": {
    "uuid": "1e120ef4-a7ed-40a7-ac5d-4c4b1f3700ec",
    "name": "test-package",
    "metadata": {
      "normalized_name": "test-package"
    },
    "created_at": "2025-07-21T12:02:14.564288Z",
    "repository": {
      "uuid": "8ea2f776-d5cd-446c-8320-ce81c3bc415d",
      "owner": "owner",
      "name": "pypi",
      "description": null,
      "searchable": false,
      "private_repo": true,
      "created_at": "2025-07-21T11:46:45.143984Z"
    },
    "release": {
      "uuid": "7185497c-a923-47e1-b195-9bea1f28defb",
      "description": null,
      "metadata": {
        "summary": "Test package.",
        "home_page": null,
        "license": null,
        "author": null,
        "stable_version": null,
        "classifiers": [],
        "author_email": null,
        "project_urls": [],
        "description_content_type": null
      },
      "name": "2025.7.21.1753099316751",
      "final_release": true,
      "pre_release": false,
      "post_release": false,
      "dev_release": false,
      "created_at": "2025-07-21T12:02:14.582392Z"
    }
  }
}
```

### Event Types

* `package.deployed`: Triggered when a new package is successfully deployed to a Repsy pypi repository.

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
