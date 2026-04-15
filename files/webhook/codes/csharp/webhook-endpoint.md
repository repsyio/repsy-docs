[HttpPost("webhook")]
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
}
