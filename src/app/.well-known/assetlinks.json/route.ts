import { NextResponse } from "next/server"

// Android Digital Asset Links — enables App Links for the Sander Android app.
// Replace SHA256_CERT_FINGERPRINT with the SHA-256 of your release keystore.
const ASSET_LINKS = [
  {
    relation: ["delegate_permission/common.handle_all_urls"],
    target: {
      namespace: "android_app",
      package_name: "com.sanderbv.app",
      sha256_cert_fingerprints: ["SHA256_CERT_FINGERPRINT"],
    },
  },
]

export function GET() {
  return NextResponse.json(ASSET_LINKS, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  })
}
