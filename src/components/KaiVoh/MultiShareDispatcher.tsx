// /components/KaiVoh/MultiShareDispatcher.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactElement } from "react";
import { useSession } from "./SessionManager";
import type { EmbeddedMediaResult } from "./SignatureEmbedder";
import SocialConnector, {
  type SocialMediaPayload,
  type SocialPlatform as SharePlatform,
} from "./SocialConnector";
import "./styles/MultiShareDispatcher.css";
/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

/** Platforms we can broadcast to via backend /api/post/:platform */
type BroadcastPlatform = "x" | "ig" | "tiktok" | "threads";

export interface MultiShareDispatcherProps {
  media: EmbeddedMediaResult;
  onComplete: (result: { platform: BroadcastPlatform; link: string }[]) => void;
}

interface PostResult {
  platform: BroadcastPlatform;
  link: string;
}

interface PlatformStatus {
  platform: BroadcastPlatform;
  label: string;
  handle?: string;
}

type SigMetadata = EmbeddedMediaResult["metadata"];
type ShareMetadata = NonNullable<SocialMediaPayload["metadata"]>;

/* -------------------------------------------------------------------------- */
/*                               Type Guards                                  */
/* -------------------------------------------------------------------------- */

function isBroadcastPlatform(k: string): k is BroadcastPlatform {
  return k === "x" || k === "ig" || k === "tiktok" || k === "threads";
}

/* -------------------------------------------------------------------------- */
/*                         Caption / Verify URL helpers                       */
/* -------------------------------------------------------------------------- */

function ensureMaxLen(s: string, limit: number): string {
  if (s.length <= limit) return s;
  return `${s.slice(0, Math.max(0, limit - 1))}…`;
}

function makeVerifyUrl(pulse: unknown, sig: unknown): string {
  const p = typeof pulse === "number" ? String(pulse) : String(pulse ?? "");
  const s =
    typeof sig === "string"
      ? sig.slice(0, 10)
      : String(sig ?? "").slice(0, 10);
  return `https://kai.ac/verify/${p}-${s}`;
}

/**
 * Sanitize KaiSig / KKS metadata into a primitive-only, share-safe bag.
 * - Only primitive fields (string | number | boolean | null | undefined)
 * - Ensures canonical keys exist when available:
 *   pulse, kaiSignature, phiKey, chakraDay, verifierUrl, etc.
 */
function sanitizeMetadataForSocial(
  meta: SigMetadata | undefined,
): ShareMetadata {
  const result: ShareMetadata = {};
  const source = (meta ?? {}) as Record<string, unknown>;

  // Pulse: always normalized to number for ShareMetadata
  const pulseRaw = source["pulse"];
  let pulseNumber: number | undefined;

  if (typeof pulseRaw === "number") {
    pulseNumber = pulseRaw;
  } else if (typeof pulseRaw === "string") {
    const parsed = Number(pulseRaw);
    if (!Number.isNaN(parsed)) {
      pulseNumber = parsed;
    }
  }

  if (typeof pulseNumber === "number") {
    result.pulse = pulseNumber;
  }

  // Kai Signature
  const kaiSignatureRaw = source["kaiSignature"];
  if (typeof kaiSignatureRaw === "string") {
    result.kaiSignature = kaiSignatureRaw;
  }

  // PhiKey ID
  const phiKeyRaw = source["phiKey"];
  if (typeof phiKeyRaw === "string") {
    result.phiKey = phiKeyRaw;
  }

  // Chakra day
  const chakraDayRaw = source["chakraDay"];
  if (typeof chakraDayRaw === "string") {
    result.chakraDay = chakraDayRaw;
  }

  // Verifier URL (must be a real http(s) URL)
  const verifierUrlRaw = source["verifierUrl"];
  if (
    typeof verifierUrlRaw === "string" &&
    (verifierUrlRaw.startsWith("http://") ||
      verifierUrlRaw.startsWith("https://"))
  ) {
    result.verifierUrl = verifierUrlRaw;
  }

  // Copy a few extra well-known KKS fields (primitives only) for future-proofing.
  const extraKeys = [
    "beat",
    "stepIndex",
    "step",
    "kaiTime",
    "kksVersion",
    "userPhiKey",
    "timestamp",
  ];

  for (const key of extraKeys) {
    const value = source[key];
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    ) {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Build a platform-specific caption.
 * Uses sanitized ShareMetadata so everything is deterministic and safe.
 */
function buildCaption(
  meta: ShareMetadata,
  platform: BroadcastPlatform,
  handle?: string,
): string {
  const pulseRaw = meta.pulse;
  const pulseDisplay = typeof pulseRaw === "number" ? pulseRaw : "∞";

  const fullSig =
    typeof meta.kaiSignature === "string" ? meta.kaiSignature : "";
  const shortSig = fullSig.slice(0, 10);

  const phiKey =
    typeof meta.phiKey === "string" && meta.phiKey.length > 0
      ? meta.phiKey
      : "φK";

  const link =
    typeof meta.verifierUrl === "string" && meta.verifierUrl.length > 0
      ? meta.verifierUrl
      : makeVerifyUrl(pulseRaw ?? "", fullSig);

  const baseHashtags = ["#KaiKlok", "#SigilProof", "#PostedByBreath"];
  const platformHashtags: Record<BroadcastPlatform, string[]> = {
    x: baseHashtags,
    ig: [...baseHashtags, "#HarmonicTime"],
    tiktok: [...baseHashtags, "#KaiTime", "#ForYou"],
    threads: [...baseHashtags, "#Threads"],
  };

  const byline = handle ? ` by @${handle}` : "";

  if (platform === "x") {
    // Single line, tight for Tweet length
    const oneLine = [
      `🌀 Pulse ${pulseDisplay}${byline}`,
      `Sig:${shortSig}`,
      `ID:${phiKey}`,
      `Verify:${link}`,
      ...platformHashtags.x,
    ].join(" • ");
    return ensureMaxLen(oneLine, 270);
  }

  if (platform === "ig") {
    // Multiline, link & hashtags at bottom
    return [
      `🌀 Pulse ${pulseDisplay}${byline}`,
      `Sig: ${shortSig}`,
      `ID: ${phiKey}`,
      `Verify: ${link}`,
      "",
      platformHashtags.ig.join(" "),
    ].join("\n");
  }

  if (platform === "tiktok") {
    // Link-first, hashtag heavy
    return [
      `Verify: ${link}`,
      `🌀 Pulse ${pulseDisplay}${byline}`,
      `Sig: ${shortSig} • ID: ${phiKey}`,
      platformHashtags.tiktok.join(" "),
    ].join("\n");
  }

  // threads
  return [
    `🌀 Pulse ${pulseDisplay}${byline}`,
    `Sig: ${shortSig} • ID: ${phiKey}`,
    `Verify: ${link}`,
    platformHashtags.threads.join(" "),
  ].join("\n");
}

/* -------------------------------------------------------------------------- */
/*                          MultiShareDispatcher UI                           */
/* -------------------------------------------------------------------------- */

export default function MultiShareDispatcher({
  media,
  onComplete,
}: MultiShareDispatcherProps): ReactElement {
  const { session } = useSession();

  // Connected accounts → broadcast targets
  const targets = useMemo<PlatformStatus[]>(() => {
    const list: PlatformStatus[] = [];
    if (!session || !session.connectedAccounts) return list;

    for (const [k, v] of Object.entries(session.connectedAccounts)) {
      if (!v) continue;
      if (!isBroadcastPlatform(k)) continue;

      const label =
        k === "x"
          ? "X / Twitter"
          : k === "ig"
          ? "Instagram"
          : k === "tiktok"
          ? "TikTok"
          : "Threads";

      list.push({ platform: k, label, handle: v });
    }
    return list;
  }, [session]);

  // Selection state: deterministic, updates when targets change.
  const [selection, setSelection] = useState<Record<BroadcastPlatform, boolean>>(
    () => ({
      x: false,
      ig: false,
      tiktok: false,
      threads: false,
    }),
  );

  useEffect(() => {
    if (targets.length === 0) {
      setSelection({
        x: false,
        ig: false,
        tiktok: false,
        threads: false,
      });
      return;
    }

    setSelection((prev) => {
      const next: Record<BroadcastPlatform, boolean> = { ...prev };
      let changed = false;

      // Auto-select any newly-connected platforms by default
      for (const t of targets) {
        if (!next[t.platform]) {
          next[t.platform] = true;
          changed = true;
        }
      }

      // Deselect platforms no longer connected
      (Object.keys(next) as BroadcastPlatform[]).forEach((key) => {
        if (!targets.some((t) => t.platform === key) && next[key]) {
          next[key] = false;
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [targets]);

  const [broadcastStatus, setBroadcastStatus] = useState<
    "idle" | "posting" | "done"
  >("idle");
  const [broadcastResults, setBroadcastResults] = useState<PostResult[]>([]);

  // Manual share tracking (from SocialConnector)
  const [manualShared, setManualShared] = useState(false);
  const [lastManualPlatform, setLastManualPlatform] =
    useState<SharePlatform | null>(null);
  const [manualError, setManualError] = useState<string | null>(null);

  const toggle = (p: BroadcastPlatform): void => {
    setSelection((prev) => ({ ...prev, [p]: !prev[p] }));
  };

  /* ------------------------------------------------------------------------ */
  /*                   Canonical share metadata & payload                     */
  /* ------------------------------------------------------------------------ */

  const shareMetadata = useMemo<ShareMetadata>(
    () => sanitizeMetadataForSocial(media.metadata),
    [media.metadata],
  );

  // Adapt EmbeddedMediaResult → SocialMediaPayload (image glyph + KKS metadata)
  const socialMedia: SocialMediaPayload = useMemo(
    () => ({
      content: media.content,
      filename: media.filename,
      type: "image",
      metadata: shareMetadata,
    }),
    [media.content, media.filename, shareMetadata],
  );

  /* ------------------------------------------------------------------------ */
  /*                             Backend posting                              */
  /* ------------------------------------------------------------------------ */

  async function postToPlatform(
    platform: BroadcastPlatform,
    handle?: string,
  ): Promise<{ link: string }> {
    const form = new FormData();
    form.append("file", media.content, media.filename);

    const caption = buildCaption(shareMetadata, platform, handle);
    form.append("caption", caption);

    if (handle) form.append("handle", handle);

    const res = await fetch(`/api/post/${platform}`, {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      throw new Error(`POST /api/post/${platform} failed: ${res.status}`);
    }

    const json = (await res.json()) as { url?: string };
    return { link: json.url ?? "#" };
  }

  const handlePostSelected = async (): Promise<void> => {
    if (!session) return;

    const selectedTargets = targets.filter((t) => selection[t.platform]);
    if (selectedTargets.length === 0) return;

    setBroadcastStatus("posting");
    setBroadcastResults([]);

    const promises = selectedTargets.map(async (t) => {
      try {
        const result = await postToPlatform(t.platform, t.handle);
        return { platform: t.platform, link: result.link };
      } catch (e) {
        console.warn(`Post to ${t.platform} failed:`, e);
        return { platform: t.platform, link: "❌ Failed" };
      }
    });

    const posted = await Promise.all(promises);
    setBroadcastResults(posted);
    setBroadcastStatus("done");
  };

  const allDisabled =
    targets.length === 0 || !targets.some((t) => selection[t.platform]);

  const canContinue = broadcastStatus === "done" || manualShared;

  /* ------------------------------------------------------------------------ */
  /*                                   Render                                 */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="kv-share-shell flex flex-col gap-6 w-full max-w-2xl">
      <header className="kv-share-header">
        <h2 className="kv-share-title">Broadcast to connected socials</h2>
        <p className="kv-share-subtitle">
          Post directly to linked accounts, then (or instead) use the manual
          share hub below to reach any platform — every share carries your
          Kai-Sigil proof.
        </p>
      </header>

      {/* Connected / broadcast selection */}
      <section className="kv-share-broadcast">
        {targets.length === 0 ? (
          <p className="kv-share-empty">
            No platforms connected yet. You can still share manually below.
          </p>
        ) : (
          <>
            <div className="kv-share-connected-label">Connected accounts</div>
            <div className="grid grid-cols-2 gap-3 w-full">
              {targets.map((t) => (
                <label
                  key={t.platform}
                  className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition ${
                    selection[t.platform]
                      ? "border-emerald-400 bg-emerald-400/10"
                      : "border-white/20 bg-white/5"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="accent-emerald-400"
                    checked={!!selection[t.platform]}
                    onChange={() => toggle(t.platform)}
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {t.label} {t.handle ? `· @${t.handle}` : ""}
                    </span>
                    <span className="text-xs opacity-60">
                      Auto-post via KaiVoh
                    </span>
                  </div>
                </label>
              ))}
            </div>

            <div className="mt-3">
              <button
                type="button"
                disabled={allDisabled || broadcastStatus === "posting"}
                onClick={() => void handlePostSelected()}
                className={`kv-btn kv-btn-primary ${
                  allDisabled || broadcastStatus === "posting"
                    ? "kv-btn-disabled"
                    : ""
                }`}
              >
                {broadcastStatus === "posting"
                  ? "Posting with breath…"
                  : allDisabled
                  ? "No platforms selected"
                  : "Post to Selected"}
              </button>
            </div>

            {broadcastStatus === "done" && (
              <div className="kv-share-results mt-3">
                <h3 className="text-xs uppercase tracking-wide opacity-60 mb-2">
                  Post results
                </h3>
                <ul className="text-sm space-y-1">
                  {broadcastResults.map((r) => (
                    <li
                      key={r.platform}
                      className="flex items-center gap-2 break-all"
                    >
                      <span className="font-semibold min-w-[80px] capitalize">
                        {r.platform}
                      </span>
                      <span>:</span>
                      {r.link === "❌ Failed" ? (
                        <span className="text-red-400">{r.link}</span>
                      ) : (
                        <a
                          href={r.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          {r.link}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </section>

      {/* Manual / user-driven share hub */}
      <section className="kv-share-manual">
        <SocialConnector
          media={socialMedia}
          onShared={(platform: SharePlatform) => {
            setManualShared(true);
            setLastManualPlatform(platform);
            setManualError(null);
          }}
          onError={(_platform, err) => {
            setManualError(err.message);
          }}
        />
        {lastManualPlatform && (
          <p className="kv-share-status text-xs opacity-70 mt-2">
            Last shared via{" "}
            <span className="font-semibold">{lastManualPlatform}</span>.
          </p>
        )}
        {manualError && (
          <p className="kv-share-error text-xs text-red-400 mt-1">
            {manualError}
          </p>
        )}
      </section>

      {/* Flow continuation */}
      <footer className="kv-share-footer mt-4 flex flex-col items-center gap-2">
        <button
          type="button"
          className={`kv-btn kv-btn-primary ${
            !canContinue ? "kv-btn-disabled" : ""
          }`}
          disabled={!canContinue}
          onClick={() => {
            onComplete(broadcastResults);
          }}
        >
          {canContinue
            ? "Continue to Verify"
            : "Share at least once to continue"}
        </button>
      </footer>
    </div>
  );
}
