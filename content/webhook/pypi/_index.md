+++
title = "Pypi"
weight = 83
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
java=`@PostMapping("/webhook")
public ResponseEntity<Void> handleWebhook(
    @RequestBody String payload,
    @RequestHeader("X-Repsy-Signature") String signature,
    @RequestHeader("X-Repsy-Timestamp") String timestamp) {
  if (!validateSignature(payload, signature, timestamp)) {
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
  }

  // TODO: your webhook operations

  return ResponseEntity.ok().build();
}`

csharp=`[HttpPost("webhook")]
public IActionResult HandleWebhook(
    [FromBody] string payload,
    [FromHeader(Name = "X-Repsy-Signature")] string signature,
    [FromHeader(Name = "X-Repsy-Timestamp")] string timestamp)
{
  if (!ValidateSignature(payload, signature, timestamp))
  {
    return Unauthorized();
  }

  // TODO: your webhook operations

  return Ok();
}`

javascript=`app.post('/webhook', (req, res) => {
  const payload = req.body;
  const signature = req.header('X-Repsy-Signature');
  const timestamp = req.header('X-Repsy-Timestamp');

  if (!validateSignature(payload, signature, timestamp)) {
    return res.status(401).send('Unauthorized');
  }

  // TODO: your webhook operations

  res.sendStatus(200);
});`>}}

Example Validation Method:

{{< code-tabs
java=`private boolean validateSignature(
    String payload,
    String signature,
    String timestamp) {
  try {
    String timestampedData = timestamp + "." + payload;
    Mac sha256Hmac = Mac.getInstance("HmacSHA256");
    byte[] keyBytes = Base64.getUrlDecoder().decode(this.secretKey);
    SecretKeySpec keySpec = new SecretKeySpec(keyBytes, "HmacSHA256");

    sha256Hmac.init(keySpec);
    byte[] rawHmac = sha256Hmac.doFinal(timestampedData.getBytes(StandardCharsets.UTF_8));
    String expectedSignature = Base64.getEncoder().encodeToString(rawHmac);

    return expectedSignature.equals(signature);
  } catch (Exception e) {
    return false;
  }
}`

javascript=`const crypto = require('crypto');

function validateSignature(payload, signature, timestamp, secretKey) {
  try {
    const timestampedData = timestamp + "." + payload;

    const base64urlToBase64 = (str) => str.replace(/-/g, '+').replace(/_/g, '/');
    const keyBuffer = Buffer.from(base64urlToBase64(secretKey), 'base64');

    const hmac = crypto.createHmac('sha256', keyBuffer);
    hmac.update(timestampedData, 'utf8');
    const rawHmac = hmac.digest();

    const expectedSignature = rawHmac.toString('base64');

    return expectedSignature === signature;
  } catch (e) {
    return false;
  }
}`>}}

### Need Help?

Reach out to [support@repsy.io](mailto:support@repsy.io) if you need help integrating or testing webhooks.
