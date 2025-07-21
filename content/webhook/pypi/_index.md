+++
title = "Pypi"
weight = 30
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

* `artifact.deployed`: Triggered when a new artifact is successfully deployed to a Repsy Maven repository.

### Authenticating Webhook Events

To ensure webhook authenticity, Repsy signs every request using an HMAC SHA-256 signature with your shared secret key.

Two custom headers are sent with each request:

* **`X-Repsy-Signature`**: A Base64-encoded HMAC SHA-256 signature of the request. You can use this to verify the authenticity of the webhook.
* **`X-Repsy-Timestamp`**: The ISO 8601 UTC timestamp indicating when the event was triggered.

#### Signature Calculation

You can verify the request by recalculating the signature with the following logic:

```java
final String timestampedData = timestamp + "." + rawJsonBody;
Mac sha256Hmac = Mac.getInstance("HmacSHA256");
SecretKeySpec keySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
sha256Hmac.init(keySpec);
byte[] rawHmac = sha256Hmac.doFinal(timestampedData.getBytes(StandardCharsets.UTF_8));
String expectedSignature = Base64.getEncoder().encodeToString(rawHmac);
```

You should reject requests if:

* The timestamp is older than a few minutes (to prevent replay attacks).
* The signature doesn't match.

### Generating a Secret Key

You can generate a secure webhook secret key using:

```java
SecureRandom secureRandom = new SecureRandom();
byte[] bytes = new byte[24];
secureRandom.nextBytes(bytes);
String secretKey = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
```

Store this secret securely. You’ll need it to validate webhook requests.

### Handling Failures

If your webhook endpoint is unavailable or returns a non-2xx status code, Repsy may retry the request after some delay.

To prevent duplicate processing, always use the `event_id` to ensure idempotency.

### Security Best Practices

* Use HTTPS for your webhook URL.
* Validate the timestamp and signature.
* Log received events for auditing and debugging.

### Example Integration (Spring Boot)

Example Endpoint:
```java
@PostMapping("/webhook")
public ResponseEntity<Void> handleWebhook(
    @RequestBody final @NotNull WebhookEvent event,
    @RequestHeader("X-Repsy-Signature") final @NotNull String signature,
    @RequestHeader("X-Repsy-Timestamp") final @NotNull String timestamp
) {
    if (!validateSignature(event, signature, timestamp)) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
    
    return ResponseEntity.ok().build();
}
```

Example Validation Method:

```java
public boolean validateSignature(
  final @NotNull WebhookEvent event,
  final @NotNull String signature,
  final @NotNull String timestamp) {
  try {
    final String eventJson = convertEventToJson(event);
    final String data = timestamp + "." + eventJson;

    final Mac sha256Hmac = Mac.getInstance("HmacSHA256");
    final SecretKeySpec keySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    sha256Hmac.init(keySpec);
    byte[] rawHmac = sha256Hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
    String expectedSignature = Base64.getEncoder().encodeToString(rawHmac);

    return expectedSignature.equals(signature);
  } catch (final Exception e) {
    return false;
  }
}
```

You can find example webhook consumers in [GitHub](https://github.com/repsyio/example-webhook-handler).

{{< /steps >}}

### Need Help?

Reach out to [support@repsy.io](mailto:support@repsy.io) if you need help integrating or testing webhooks.
