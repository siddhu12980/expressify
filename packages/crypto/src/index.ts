import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto"

function getKey() {
  const value = process.env.GITHUB_TOKEN_ENCRYPTION_KEY

  if (!value) {
    throw new Error("GITHUB_TOKEN_ENCRYPTION_KEY is not set")
  }

  return createHash("sha256").update(value).digest()
}

export function encryptString(value: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()

  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`
}

export function decryptString(value: string) {
  const [ivHex, tagHex, dataHex] = value.split(":")

  if (!ivHex || !tagHex || dataHex === undefined) {
    throw new Error("Invalid encrypted token format")
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    getKey(),
    Buffer.from(ivHex, "hex")
  )
  decipher.setAuthTag(Buffer.from(tagHex, "hex"))

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, "hex")),
    decipher.final(),
  ])

  return decrypted.toString("utf8")
}
