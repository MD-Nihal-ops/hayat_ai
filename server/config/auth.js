function assertJwtSecret(secret) {
  if (
    typeof secret !== "string" ||
    secret.length < 32 ||
    /^(your|change|replace|placeholder|development|example)/i.test(secret)
  ) {
    throw new Error("JWT_SECRET must be a non-placeholder string of at least 32 characters");
  }
}

module.exports = { assertJwtSecret };
