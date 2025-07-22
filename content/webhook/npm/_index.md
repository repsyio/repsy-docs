+++
title = "Npm"
weight = 82
+++

Repsy allows you to receive webhook notifications whenever specific Npm repository events occur, such as new package deployments. These webhooks let you automate workflows, sync data, or trigger custom logic in your system.

This guide explains how to configure, receive, and verify webhook events securely.

{{< steps >}}

### What is a Webhook Event?

A webhook is an HTTP POST request sent by Repsy to a URL you define when a specific event happens. Webhook events are delivered as JSON payloads.

#### Example Payload

```json
{
  "event_id": "7d9e3773-5ae0-4185-a003-6658014cc15a",
  "event_type": "package.deployed",
  "webhook_url": "https://webhook.site/084cfab7-cd5b-4ed3-affa-5d394b635e1e",
  "date": "2025-07-21T11:52:08.512433165Z",
  "package": {
    "uuid": "78da8374-36a6-471b-9956-80f46659b765",
    "name": "scoped",
    "scope": "foo",
    "latest": "2025.7.21-1753098726995",
    "created_at": "2025-07-21T11:52:08.488494390Z",
    "registry": {
      "uuid": "e3083de3-b3c5-4814-9c48-f5b5dbf0bfe7",
      "owner": "owner",
      "name": "npm",
      "description": null,
      "searchable": false,
      "private_registry": true,
      "created_at": "2025-07-21T11:46:45.242489Z"
    },
    "version": {
      "uuid": "1e3aac96-8e04-40c9-8672-b0ea365ed8ef",
      "version": "2025.7.21-1753098726995",
      "description": null,
      "metadata": {
        "author_name": null,
        "license": "ISC",
        "author_url": null,
        "bugs_email": null,
        "deprecated": false,
        "author_email": null,
        "repository_url": null,
        "repository_type": null,
        "bugs_url": null,
        "homepage": null
      },
      "created_at": "2025-07-21T11:52:08.490848023Z"
    }
  }
}
```

### Event Types

* `package.deployed`: Triggered when a new package is successfully deployed to a Repsy docker repository.

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
