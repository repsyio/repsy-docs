+++
title = "Docker"
weight = 84
+++

Repsy allows you to receive webhook notifications whenever specific Docker repository events occur, such as new image deployments. These webhooks let you automate workflows, sync data, or trigger custom logic in your system.

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

* `image.deployed`: Triggered when a new image is successfully deployed to a Repsy docker repository.

### Authenticating Webhook Events

To ensure webhook authenticity, Repsy signs every request using an HMAC SHA-256 signature with your shared secret key.

Two custom headers are sent with each request:

* `X-Repsy-Signature`: A Base64-encoded HMAC SHA-256 signature of the request. You can use this to verify the authenticity of the webhook.
* `X-Repsy-Timestamp`: The ISO 8601 UTC timestamp indicating when the event was triggered.

#### Signature Calculation

You can verify the request by recalculating the signature with the following logic:

```java
final String timestampedData = timestamp + "." + payload;
final Mac sha256Hmac = Mac.getInstance("HmacSHA256");
final byte[] keyBytes = Base64.getUrlDecoder().decode(this.secretKey);
final SecretKeySpec keySpec = new SecretKeySpec(keyBytes, "HmacSHA256");
sha256Hmac.init(keySpec);
final byte[] rawHmac = sha256Hmac.doFinal(timestampedData.getBytes(StandardCharsets.UTF_8));
String expectedSignature = Base64.getEncoder().encodeToString(rawHmac);
```

You should reject requests if:

* The timestamp is older than a few minutes (to prevent replay attacks).
* The signature doesn't match.

To prevent duplicate processing, always use the `event_id` to ensure idempotency

### Security Best Practices

* Use HTTPS for your webhook URL.
* Validate the timestamp and signature.
* Log received events for auditing and debugging.

### Example Integration (Spring Boot)

Example Endpoint:
```java
@PostMapping("/webhook")
public ResponseEntity<Void> handleWebhook(
    @RequestBody final @NotNull String payload,
    @RequestHeader("X-Repsy-Signature") final @NotNull String signature,
    @RequestHeader("X-Repsy-Timestamp") final @NotNull String timestamp) {
  if (!validateSignature(payload, signature, timestamp)) {
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
  }
  
  ...

  return ResponseEntity.ok().build();
}
```

Example Validation Method:

```java
private boolean validateSignature(
    final @NotNull String payload,
    final @NotNull String signature,
    final @NotNull String timestamp) {
  try {
    final String timestampedData = timestamp + "." + payload;
    final Mac sha256Hmac = Mac.getInstance("HmacSHA256");

    final byte[] keyBytes = Base64.getUrlDecoder().decode(this.secretKey);
    final SecretKeySpec keySpec = new SecretKeySpec(keyBytes, "HmacSHA256");

    sha256Hmac.init(keySpec);
    final byte[] rawHmac = sha256Hmac.doFinal(timestampedData.getBytes(StandardCharsets.UTF_8));
    String expectedSignature = Base64.getEncoder().encodeToString(rawHmac);

    return expectedSignature.equals(signature);
  } catch (final Exception e) {
    return false;
  }
}
```

{{< /steps >}}

### Need Help?

Reach out to [support@repsy.io](mailto:support@repsy.io) if you need help integrating or testing webhooks.
