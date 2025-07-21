+++
title = "Docker"
weight = 40
+++

Repsy allows you to receive webhook notifications whenever specific Docker repository events occur, such as new artifact deployments. These webhooks let you automate workflows, sync data, or trigger custom logic in your system.

This guide explains how to configure, receive, and verify webhook events securely.

{{< steps >}}

### What is a Webhook Event?

A webhook is an HTTP POST request sent by Repsy to a URL you define when a specific event happens. Webhook events are delivered as JSON payloads.

#### Example Payload

```json
{
  "event_id": "0e3ce46d-98db-42a8-b9f4-6be52ceee0eb",
  "event_type": "image.deployed",
  "webhook_url": "https://webhook.site/084cfab7-cd5b-4ed3-affa-5d394b635e1e",
  "date": "2025-07-21T12:01:03.525814226Z",
  "image": {
    "uuid": "b1ff0315-9179-471f-8090-b86363cae072",
    "name": "default",
    "created_at": "2025-07-21T12:01:03.456839Z",
    "last_updated_at": "2025-07-21T12:01:03.456844Z",
    "repository": {
      "uuid": "064a1f9d-af9f-4cb0-8875-12b739a5fb88",
      "owner": "owner",
      "name": "docker",
      "description": null,
      "searchable": false,
      "private_repo": true,
      "created_at": "2025-07-21T11:46:45.242642Z"
    },
    "tag": {
      "uuid": "a3f6078e-bc53-4a0e-982b-5905dc68ae53",
      "name": "2025.07.21-1753099258149",
      "metadata": {
        "config_digest": null,
        "media_type": "application/vnd.docker.distribution.manifest.v2+json",
        "digest": "sha256:7565f2c7034d87673c5ddc3b1b8e97f8da794c31d9aa73ed26afffa1c8194889",
        "platform": "linux/amd64"
      },
      "created_at": "2025-07-21T12:01:03.472843Z",
      "last_updated_at": "2025-07-21T12:01:03.472848Z"
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
