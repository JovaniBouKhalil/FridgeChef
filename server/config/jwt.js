export function getJwtConfig({
  secret = process.env.JWT_SECRET,
  expiresIn = process.env.JWT_EXPIRES_IN,
} = {}) {
  const normalizedSecret = typeof secret === "string" ? secret.trim() : "";

  if (Buffer.byteLength(normalizedSecret, "utf8") < 32) {
    throw new Error("JWT_SECRET must contain at least 32 bytes.");
  }

  return {
    secret: normalizedSecret,
    expiresIn:
      typeof expiresIn === "string" && expiresIn.trim()
        ? expiresIn.trim()
        : "1d",
  };
}
