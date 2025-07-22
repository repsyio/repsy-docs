private boolean validateSignature(
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
}
