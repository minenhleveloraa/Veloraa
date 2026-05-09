import "server-only";
import crypto from "crypto";

interface PayFastParams {
  [key: string]: string;
}

export function generatePayFastSignature(params: PayFastParams): string {
  const sortedKeys = Object.keys(params)
    .filter((key) => key !== "signature" && params[key] !== "")
    .sort();

  const paramString = sortedKeys
    .map(
      (key) =>
        `${key}=${encodeURIComponent(params[key]).replace(/%20/g, "+")}`
    )
    .join("&");

  const stringToHash = process.env.PAYFAST_PASSPHRASE
    ? `${paramString}&passphrase=${encodeURIComponent(
        process.env.PAYFAST_PASSPHRASE!
      ).replace(/%20/g, "+")}`
    : paramString;

  return crypto.createHash("md5").update(stringToHash).digest("hex");
}

export function verifyPayFastSignature(params: PayFastParams): boolean {
  const receivedSignature = params.signature;
  const calculatedSignature = generatePayFastSignature(params);
  return receivedSignature === calculatedSignature;
}

export const PAYFAST_BASE_URL =
  process.env.PAYFAST_SANDBOX === "true"
    ? "https://sandbox.payfast.co.za/eng/process"
    : "https://www.payfast.co.za/eng/process";
