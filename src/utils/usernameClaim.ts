// src/utils/usernameClaim.ts
// Username-claim glyph helpers (derivative glyph minted from an origin glyph).

import { evolveGlyph } from "../glyph/glyphEngine";
import type { Glyph, GlyphMetadata } from "../glyph/types";
import {
  USERNAME_CLAIM_KIND,
  type UsernameClaimPayload,
} from "../types/usernameClaim";

/** Normalize user-provided usernames to a deterministic, lowercase form. */
export function normalizeUsername(raw: string): string {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return "";

  // Strip leading @ and collapse internal whitespace/underscore clusters.
  const withoutAt = trimmed.replace(/^@+/, "");
  const squashed = withoutAt.replace(/[\s_]+/g, " ").trim();
  const normalized = squashed.toLowerCase();

  // Remove trailing punctuation that often rides along in chat/markdown.
  return normalized.replace(/[.,;:!?]+$/g, "");
}

/** Build a canonical username-claim payload for embedding in a glyph. */
export function buildUsernameClaimPayload(
  originHash: string,
  username: string,
  ownerHint?: string | null,
): UsernameClaimPayload {
  const normalized = normalizeUsername(username);
  if (!normalized) throw new Error("Username required for claim payload");

  return {
    kind: USERNAME_CLAIM_KIND,
    username: username.trim(),
    normalized,
    originHash,
    ownerHint: ownerHint ?? null,
  };
}

/**
 * Mint a derivative username-claim glyph from an origin glyph.
 * The payload is embedded into metadata.usernameClaim for explorer ingest.
 */
export function mintUsernameClaimGlyph(params: {
  origin: Glyph;
  username: string;
  pulse: number;
  ownerHint?: string | null;
}): Glyph {
  const payload = buildUsernameClaimPayload(
    params.origin.hash,
    params.username,
    params.ownerHint ??
      params.origin.meta?.userPhiKey ??
      params.origin.metadata?.creator ??
      null,
  );

  const metadata: GlyphMetadata = {
    ...(params.origin.metadata ?? {}),
    usernameClaim: payload,
  };

  return evolveGlyph(params.origin, params.pulse, metadata);
}

