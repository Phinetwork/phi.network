// src/pages/SigilPage/verifierCanon.ts

const B58_ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

/* ──────────────────────────────────────────────────────────────
   Basic helpers
   ───────────────────────────────────────────────────────────── */

export const bytesToHexCanon = (u8: Uint8Array): string =>
  Array.from(u8)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

/**
 * Canonical SHA-256 → hex helper.
 * Accepts string or Uint8Array and always returns lowercase hex.
 */
export async function sha256HexCanon(
  msg: string | Uint8Array
): Promise<string> {
  const data: Uint8Array =
    typeof msg === "string" ? new TextEncoder().encode(msg) : msg;

  // crypto.subtle.digest expects a BufferSource.
  // We pass the underlying ArrayBuffer (cast to ArrayBuffer to satisfy TS).
  const bufferToHash: ArrayBuffer =
    data.byteOffset === 0 && data.byteLength === data.buffer.byteLength
      ? (data.buffer as ArrayBuffer)
      : data.slice().buffer;

  const buf = await crypto.subtle.digest("SHA-256", bufferToHash);
  return bytesToHexCanon(new Uint8Array(buf));
}

/* ──────────────────────────────────────────────────────────────
   Base58Check (Bitcoin-style, but canonicalized)
   ───────────────────────────────────────────────────────────── */

function base58EncodeCanon(bytes: Uint8Array): string {
  let n = 0n;
  for (const b of bytes) n = (n << 8n) + BigInt(b);

  let out = "";
  while (n > 0n) {
    const mod = Number(n % 58n);
    out = B58_ALPHABET[mod] + out;
    n /= 58n;
  }

  // Preserve leading zeros as "1" chars
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
    out = "1" + out;
  }

  return out;
}

/**
 * Base58Check with a 1-byte version prefix.
 */
export async function base58CheckCanon(
  payload: Uint8Array,
  version = 0x00
): Promise<string> {
  const v = new Uint8Array(1 + payload.length);
  v[0] = version;
  v.set(payload, 1);

  // Hash version+payload twice (Bitcoin-style), but via ArrayBuffer for TS.
  const vBuffer: ArrayBuffer = v.buffer as ArrayBuffer;
  const c1 = await crypto.subtle.digest("SHA-256", vBuffer);
  const c2 = await crypto.subtle.digest("SHA-256", c1);

  const checksum = new Uint8Array(c2).slice(0, 4);

  const full = new Uint8Array(v.length + 4);
  full.set(v);
  full.set(checksum, v.length);

  return base58EncodeCanon(full);
}

/**
 * Derive a Φ-key (owner key) from a σ-hash hex string.
 * φ-salted, then SHA-256 + Base58Check(version=0x00).
 */
export async function derivePhiKeyFromSigCanon(
  sigHex: string
): Promise<string> {
  const s = await sha256HexCanon(sigHex + "φ");
  const raw = new Uint8Array(20);

  for (let i = 0; i < 20; i++) {
    raw[i] = parseInt(s.slice(i * 2, i * 2 + 2), 16);
  }

  return base58CheckCanon(raw, 0x00);
}

/* ──────────────────────────────────────────────────────────────
   SVG canonicalization helpers
   ───────────────────────────────────────────────────────────── */

/**
 * Ensure the canonical <metadata> node is the first child of the <svg>.
 * Uses data-noncanonical="1" to skip non-canonical variants when present.
 */
export function ensureCanonicalMetadataFirst(svgEl: SVGSVGElement): void {
  try {
    const metas = Array.from(svgEl.querySelectorAll("metadata"));
    if (!metas.length) return;

    const canon =
      metas.find((m) => m.getAttribute("data-noncanonical") !== "1") ??
      metas[0];

    if (canon && svgEl.firstChild !== canon) {
      svgEl.insertBefore(canon, svgEl.firstChild);
    }
  } catch {
    // Non-fatal; verifier can still run without reordering.
  }
}

/* ──────────────────────────────────────────────────────────────
   Σ builder + intention reader
   ───────────────────────────────────────────────────────────── */

/**
 * Canonical σ-string used for kaiSignature:
 *   pulse|beat|stepIndex|chakraDay|intentionSigil?
 */
export function verifierSigmaString(
  pulse: number,
  beat: number,
  stepIndex: number,
  chakraDay: string,
  intentionSigil?: string
): string {
  return `${pulse}|${beat}|${stepIndex}|${chakraDay}|${intentionSigil ?? ""}`;
}

/**
 * Read optional "intentionSigil" field from a loose object payload.
 */
export function readIntentionSigil(obj: unknown): string | undefined {
  if (typeof obj !== "object" || obj === null) return undefined;
  const rec = obj as Record<string, unknown>;
  const v = rec["intentionSigil"];
  return typeof v === "string" ? v : undefined;
}
