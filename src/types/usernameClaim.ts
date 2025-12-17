// src/types/usernameClaim.ts
// Canonical username-claim glyph payload + helpers.

export const USERNAME_CLAIM_KIND = "username_claim" as const;

/** Payload embedded inside a derivative username-claim glyph. */
export interface UsernameClaimPayload {
  kind: typeof USERNAME_CLAIM_KIND;
  username: string;      // raw user-provided handle (may include @ / casing)
  normalized: string;    // canonicalized username (lowercase, trimmed, no @)
  originHash: string;    // hash of the origin glyph this claim was minted from
  ownerHint?: string | null; // optional owner hint (phiKey, label, etc.)
}

/** Registry entry surfaced to explorers (normalized username keyed). */
export interface UsernameClaimRegistryEntry {
  username: string;
  normalized: string;
  claimHash: string;   // hash of the username-claim glyph
  claimUrl: string;    // Memory Stream token/URL for the claim glyph
  originHash: string;  // origin glyph hash bound to this username
  ownerHint?: string | null;
  updatedAt: number;
}

