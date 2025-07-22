@PostMapping("/webhook")
public ResponseEntity<Void> handleWebhook(
    @RequestBody String payload,
    @RequestHeader("X-Repsy-Signature") String signature,
    @RequestHeader("X-Repsy-Timestamp") String timestamp) {
  if (!validateSignature(payload, signature, timestamp)) {
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
  }

  // TODO: your webhook operations

  return ResponseEntity.ok().build();
}
