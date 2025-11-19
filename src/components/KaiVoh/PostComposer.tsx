// src/components/KaiVoh/PostComposer.tsx

"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "./styles/PostComposer.css";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type AttachmentKind =
  | "image"
  | "video"
  | "audio"
  | "document"
  | "archive"
  | "other";

export interface PostAttachment {
  id: string;
  file: File;
  kind: AttachmentKind;
}

export type PostKind =
  | "general"
  | "legal-contract"
  | "evidence"
  | "announcement"
  | "private-note";

export interface LegalMetadata {
  agreementTitle?: string;
  counterpartyName?: string;
  counterpartyEmail?: string;
  jurisdiction?: string;
  effectiveDateIso?: string;
  referenceCode?: string;
  isConfidential?: boolean;
  includesPersonalData?: boolean;
}

/**
 * ComposedPost is the sealed payload for the rest of the system.
 *
 * - `mediaType` + `file` remain the "primary" attachment (for legacy + preview).
 * - `attachments` includes *all* attached files (including the primary).
 * - `postKind` + `legalMeta` allow this to be used for serious legal / contract work.
 * - `linkUrl` lets you bind an external canonical URL (doc system, drive link, etc.).
 */
export interface ComposedPost {
  /**
   * Primary attachment's media type for display / legacy flows.
   * "file" is used when the primary is not an image or video.
   */
  mediaType: "image" | "video" | "file";
  /**
   * Primary file (image, video, PDF, DOCX, etc.).
   */
  file: File;
  caption?: string;

  /**
   * All attached files (including the primary).
   */
  attachments: PostAttachment[];
  /**
   * ID of the primary attachment in `attachments`.
   */
  mainAttachmentId: string;

  /**
   * High-level intent of the post (general vs legal, evidence, etc.).
   */
  postKind: PostKind;

  /**
   * Optional legal / contract metadata to make this seal usable
   * as an official record in legal contexts.
   */
  legalMeta?: LegalMetadata;

  /**
   * Optional canonical URL for this agreement / evidence / resource.
   * e.g. DMS link, IPFS URL, document share, etc.
   */
  linkUrl?: string;
}

interface PostComposerProps {
  onReady: (post: ComposedPost) => void;
}

/* -------------------------------------------------------------------------- */
/*                                  Constants                                 */
/* -------------------------------------------------------------------------- */

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB per file
const MAX_ATTACHMENTS = 10;

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"] as const;
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = bytes / Math.pow(k, i);
  return `${val.toFixed(val >= 10 ? 0 : 1)} ${units[i]}`;
}

function deriveAttachmentKind(file: File): AttachmentKind {
  const { type, name } = file;
  const lowerName = name.toLowerCase();

  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";

  if (
    type === "application/pdf" ||
    type.startsWith("text/") ||
    type.includes("word") ||
    type.includes("officedocument") ||
    type.includes("spreadsheet") ||
    type.includes("presentation")
  ) {
    return "document";
  }

  if (
    lowerName.endsWith(".zip") ||
    lowerName.endsWith(".rar") ||
    lowerName.endsWith(".7z") ||
    lowerName.endsWith(".tar") ||
    lowerName.endsWith(".gz")
  ) {
    return "archive";
  }

  return "other";
}

const ATTACHMENT_KIND_LABEL: Record<AttachmentKind, string> = {
  image: "Image",
  video: "Video",
  audio: "Audio",
  document: "Document",
  archive: "Archive",
  other: "File",
};

function generateAttachmentId(file: File): string {
  return [
    file.name,
    file.size,
    file.lastModified,
    Date.now(),
    Math.random().toString(36).slice(2, 8),
  ].join("-");
}

/* -------------------------------------------------------------------------- */
/*                               PostComposer UI                              */
/* -------------------------------------------------------------------------- */

export default function PostComposer({ onReady }: PostComposerProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const currentUrlRef = useRef<string | null>(null);

  const [attachments, setAttachments] = useState<PostAttachment[]>([]);
  const [primaryAttachmentId, setPrimaryAttachmentId] = useState<string | null>(
    null
  );
  const [primaryPreviewUrl, setPrimaryPreviewUrl] = useState<string | null>(
    null
  );
  const [primaryMediaType, setPrimaryMediaType] = useState<
    "image" | "video" | "file"
  >("file");

  const [caption, setCaption] = useState<string>("");
  const [linkUrl, setLinkUrl] = useState<string>("");

  const [postKind, setPostKind] = useState<PostKind>("general");

  const [legalTitle, setLegalTitle] = useState<string>("");
  const [legalCounterparty, setLegalCounterparty] = useState<string>("");
  const [legalEmail, setLegalEmail] = useState<string>("");
  const [legalJurisdiction, setLegalJurisdiction] = useState<string>("");
  const [legalEffectiveDate, setLegalEffectiveDate] = useState<string>("");
  const [legalReferenceCode, setLegalReferenceCode] = useState<string>("");

  const [legalConfidential, setLegalConfidential] = useState<boolean>(false);
  const [legalPersonalData, setLegalPersonalData] = useState<boolean>(false);

  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const CAPTION_MAX = 1000;

  const hasAttachments = attachments.length > 0;
  const requiresLegalDetails = postKind === "legal-contract";

  const totalSizeBytes = useMemo(
    () => attachments.reduce((sum, att) => sum + att.file.size, 0),
    [attachments]
  );

  const totalSizeLabel = useMemo(
    () => (hasAttachments ? formatBytes(totalSizeBytes) : "0 B"),
    [hasAttachments, totalSizeBytes]
  );

  const legalIsComplete = useMemo(() => {
    if (!requiresLegalDetails) return true;
    return legalTitle.trim().length > 0 && legalCounterparty.trim().length > 0;
  }, [requiresLegalDetails, legalTitle, legalCounterparty]);

  const step = useMemo(() => {
    if (!hasAttachments) return 1;
    if (!legalIsComplete) return 2;
    return 3;
  }, [hasAttachments, legalIsComplete]);

  const stepLabel = useMemo(() => {
    if (step === 1) {
      return requiresLegalDetails
        ? "Attach your agreement, annexes, and evidence"
        : "Attach the media or files you want to seal";
    }
    if (step === 2) {
      return requiresLegalDetails
        ? "Describe the agreement and parties"
        : "Add context: caption, link, and tags";
    }
    return requiresLegalDetails
      ? "Review and seal as a legal record"
      : "Review and seal to the KaiVoh stream";
  }, [step, requiresLegalDetails]);

  const clearPreviewUrl = useCallback(() => {
    if (currentUrlRef.current) {
      URL.revokeObjectURL(currentUrlRef.current);
      currentUrlRef.current = null;
    }
  }, []);

  const updatePreviewUrl = useCallback(
    (url: string | null) => {
      clearPreviewUrl();
      if (url) {
        currentUrlRef.current = url;
      }
      setPrimaryPreviewUrl(url);
    },
    [clearPreviewUrl]
  );

  // Cleanup on unmount
  useEffect(
    () => () => {
      clearPreviewUrl();
    },
    [clearPreviewUrl]
  );

  // Whenever attachments or primaryAttachmentId change, choose preview + primary type
  useEffect(() => {
    if (!hasAttachments) {
      setPrimaryAttachmentId(null);
      setPrimaryMediaType("file");
      updatePreviewUrl(null);
      return;
    }

    let primary =
      attachments.find((att) => att.id === primaryAttachmentId) ?? null;

    if (!primary) {
      // Prefer image/video as primary if available, otherwise first attachment
      primary =
        attachments.find(
          (att) => att.kind === "image" || att.kind === "video"
        ) ?? attachments[0];
      if (primaryAttachmentId !== primary.id) {
        setPrimaryAttachmentId(primary.id);
      }
    }

    if (!primary) {
      setPrimaryMediaType("file");
      updatePreviewUrl(null);
      return;
    }

    if (primary.kind === "image" || primary.kind === "video") {
      const url = URL.createObjectURL(primary.file);
      updatePreviewUrl(url);
      setPrimaryMediaType(primary.kind);
    } else {
      setPrimaryMediaType("file");
      updatePreviewUrl(null);
    }
  }, [
    attachments,
    hasAttachments,
    primaryAttachmentId,
    updatePreviewUrl,
    setPrimaryAttachmentId,
  ]);

  const resetComposer = useCallback(() => {
    setAttachments([]);
    setPrimaryAttachmentId(null);
    setPrimaryMediaType("file");
    updatePreviewUrl(null);

    setCaption("");
    setLinkUrl("");
    setPostKind("general");

    setLegalTitle("");
    setLegalCounterparty("");
    setLegalEmail("");
    setLegalJurisdiction("");
    setLegalEffectiveDate("");
    setLegalReferenceCode("");
    setLegalConfidential(false);
    setLegalPersonalData(false);

    setError(null);
    setIsSubmitting(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [updatePreviewUrl]);

  const processFiles = useCallback(
    (fileList: FileList | File[]) => {
      const filesArray = Array.isArray(fileList)
        ? fileList
        : Array.from(fileList);
      if (filesArray.length === 0) return;

      let rejectedDueToSize = false;
      let rejectedDueToLimit = false;

      let next = [...attachments];

      for (const file of filesArray) {
        if (next.length >= MAX_ATTACHMENTS) {
          rejectedDueToLimit = true;
          break;
        }
        if (file.size > MAX_FILE_SIZE_BYTES) {
          rejectedDueToSize = true;
          continue;
        }

        const alreadyAdded = next.some(
          (att) =>
            att.file.name === file.name &&
            att.file.size === file.size &&
            att.file.lastModified === file.lastModified
        );
        if (alreadyAdded) {
          continue;
        }

        const kind = deriveAttachmentKind(file);
        const attachment: PostAttachment = {
          id: generateAttachmentId(file),
          file,
          kind,
        };
        next = [...next, attachment];
      }

      if (next.length === attachments.length && !rejectedDueToSize) {
        // Nothing new added and no size issue: don't overwrite an existing error.
        if (!rejectedDueToLimit) {
          setError("No new files were added (duplicates or all invalid).");
        }
      } else {
        setError(null);
      }

      if (rejectedDueToSize) {
        setError(
          `Some files were too large. Max individual file size is ${formatBytes(
            MAX_FILE_SIZE_BYTES
          )}.`
        );
      } else if (rejectedDueToLimit) {
        setError(
          `You can attach up to ${MAX_ATTACHMENTS} files per sealed post. Remove one to add another.`
        );
      }

      setAttachments(next);
    },
    [attachments]
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    processFiles(files);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    processFiles(files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  };

  const handleOpenFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleDropzoneKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleOpenFilePicker();
    }
  };

  const handleRemoveAttachment = (id: string) => {
    const next = attachments.filter((att) => att.id !== id);
    setAttachments(next);
    if (next.length === 0) {
      setPrimaryAttachmentId(null);
    } else if (primaryAttachmentId === id) {
      setPrimaryAttachmentId(next[0].id);
    }
  };

  const handlePrimarySelect = (id: string) => {
    setPrimaryAttachmentId(id);
  };

  const handleProceed = () => {
    if (!hasAttachments) {
      setError("Attach at least one file to seal.");
      return;
    }

    if (requiresLegalDetails && !legalIsComplete) {
      setError("Fill in the agreement title and counterparty to seal legally.");
      return;
    }

    const trimmedLink = linkUrl.trim();
    if (trimmedLink.length > 0) {
      try {
        // Basic URL validation; will throw if invalid
        // eslint-disable-next-line no-new
        new URL(trimmedLink);
      } catch {
        setError("The link URL looks invalid. Please check it.");
        return;
      }
    }

    const primary =
      attachments.find((att) => att.id === primaryAttachmentId) ??
      attachments[0];

    if (!primary) {
      setError("Something went wrong selecting the primary attachment.");
      return;
    }

    const trimmedCaption = caption.trim();

    const legalMeta: LegalMetadata | undefined = requiresLegalDetails
      ? {
          agreementTitle: legalTitle.trim() || undefined,
          counterpartyName: legalCounterparty.trim() || undefined,
          counterpartyEmail: legalEmail.trim() || undefined,
          jurisdiction: legalJurisdiction.trim() || undefined,
          effectiveDateIso: legalEffectiveDate || undefined,
          referenceCode: legalReferenceCode.trim() || undefined,
          isConfidential: legalConfidential,
          includesPersonalData: legalPersonalData,
        }
      : undefined;

    setIsSubmitting(true);

    const post: ComposedPost = {
      mediaType:
        primary.kind === "image" || primary.kind === "video"
          ? primary.kind
          : "file",
      file: primary.file,
      caption: trimmedCaption.length > 0 ? trimmedCaption : undefined,
      attachments,
      mainAttachmentId: primary.id,
      postKind,
      legalMeta,
      linkUrl: trimmedLink.length > 0 ? trimmedLink : undefined,
    };

    onReady(post);
  };

  const fileMetaSummary = useMemo(() => {
    if (!hasAttachments) return null;
    const count = attachments.length;
    const label =
      count === 1 ? "1 attached file" : `${count} attached files total`;
    return `${label} • ${totalSizeLabel}`;
  }, [attachments, hasAttachments, totalSizeLabel]);

  return (
    <div className="kv-post-composer flex flex-col items-center gap-4 p-6 w-full">
      {/* Header / Step indicator */}
      <div className="kv-post-header w-full max-w-xl flex flex-col gap-2">
        <div className="kv-post-step-row flex items-center justify-between">
          <div className="kv-post-step-badge">
            <span className="kv-post-step-number">{step}</span>
            <span className="kv-post-step-label">{stepLabel}</span>
          </div>

          {hasAttachments && (
            <button
              type="button"
              className="kv-post-reset-btn"
              onClick={resetComposer}
            >
              Reset
            </button>
          )}
        </div>

        <p className="kv-post-subtitle">
          Attach images, videos, PDFs, DOCX, ZIPs—anything you want sealed to
          your Kai-Signature. For contracts, add parties and jurisdiction so
          this becomes a usable, timestamped record.
        </p>

        {/* Post kind selector */}
        <div className="kv-post-kind-row flex flex-wrap items-center gap-3 mt-1">
          <label className="kv-post-kind-label" htmlFor="kv-post-kind">
            Intent
          </label>
          <select
            id="kv-post-kind"
            className="kv-post-kind-select"
            value={postKind}
            onChange={(e) =>
              setPostKind(e.target.value as PostKind)
            }
          >
            <option value="general">General post / media</option>
            <option value="legal-contract">Legal contract / agreement</option>
            <option value="evidence">Evidence / proof bundle</option>
            <option value="announcement">Public announcement / notice</option>
            <option value="private-note">Private note / internal record</option>
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="kv-post-error w-full max-w-xl" role="alert">
          {error}
        </div>
      )}

      {/* Dropzone */}
      <div className="w-full max-w-xl">
        <div
          className={[
            "kv-post-dropzone",
            isDragging ? "kv-post-dropzone--dragging" : "",
            hasAttachments ? "kv-post-dropzone--has-media" : "",
          ]
            .join(" ")
            .trim()}
          tabIndex={0}
          role="button"
          aria-label="Choose or drop files to attach"
          onClick={handleOpenFilePicker}
          onKeyDown={handleDropzoneKeyDown}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="kv-post-dropzone-inner">
            <div className="kv-post-dropzone-icon">
              {hasAttachments ? "🔄" : isDragging ? "🌀" : "📁"}
            </div>
            <div className="kv-post-dropzone-text">
              <div className="kv-post-dropzone-title">
                {hasAttachments
                  ? "Add or replace attached files"
                  : "Tap or drop files to start"}
              </div>
              <div className="kv-post-dropzone-hint">
                Images, videos, PDFs, DOCX, ZIPs, audio, and more • Drag &amp;
                drop or tap to choose
              </div>
              <div className="kv-post-dropzone-meta">
                Max {MAX_ATTACHMENTS} files • {formatBytes(MAX_FILE_SIZE_BYTES)}{" "}
                per file
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview + attachments + caption */}
      {hasAttachments && (
        <div className="kv-post-body w-full max-w-xl mt-2">
          {/* Primary media preview if image/video */}
          {primaryPreviewUrl && (
            <div className="kv-post-preview">
              {primaryMediaType === "image" && (
                <img
                  src={primaryPreviewUrl}
                  alt="Primary attachment preview"
                  className="kv-post-preview-media"
                />
              )}
              {primaryMediaType === "video" && (
                <video
                  src={primaryPreviewUrl}
                  controls
                  className="kv-post-preview-media"
                />
              )}
            </div>
          )}

          {/* Attachment list */}
          <div className="kv-post-attachments">
            <div className="kv-post-attachments-header flex justify-between items-center">
              <div className="kv-post-attachments-title">
                Attachments
              </div>
              {fileMetaSummary && (
                <div className="kv-post-attachments-summary">
                  {fileMetaSummary}
                </div>
              )}
            </div>
            <ul className="kv-post-attachments-list">
              {attachments.map((att) => {
                const isPrimary = att.id === primaryAttachmentId;
                return (
                  <li
                    key={att.id}
                    className={[
                      "kv-post-attachment-item",
                      isPrimary ? "kv-post-attachment-item--primary" : "",
                    ]
                      .join(" ")
                      .trim()}
                  >
                    <div className="kv-post-attachment-main">
                      <div className="kv-post-attachment-name">
                        {att.file.name}
                      </div>
                      <div className="kv-post-attachment-meta">
                        <span>
                          {ATTACHMENT_KIND_LABEL[att.kind]} •{" "}
                          {formatBytes(att.file.size)}
                        </span>
                        {isPrimary && (
                          <span className="kv-post-attachment-pill">
                            Primary
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="kv-post-attachment-actions">
                      {!isPrimary && (
                        <button
                          type="button"
                          className="kv-post-attachment-btn"
                          onClick={() => handlePrimarySelect(att.id)}
                        >
                          Set as primary
                        </button>
                      )}
                      <button
                        type="button"
                        className="kv-post-attachment-btn kv-post-attachment-btn--danger"
                        onClick={() => handleRemoveAttachment(att.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Caption */}
          <div className="kv-post-caption-block mt-4">
            <label
              htmlFor="kv-post-caption"
              className="kv-post-caption-label"
            >
              Caption / description (optional)
            </label>
            <textarea
              id="kv-post-caption"
              placeholder={
                requiresLegalDetails
                  ? "Summarize what this agreement covers, key obligations, or why you are sealing it now…"
                  : "Describe the moment, the pulse, or what this bundle of files represents…"
              }
              className="kv-post-caption-textarea"
              rows={3}
              maxLength={CAPTION_MAX}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
            <div className="kv-post-caption-footer">
              <span className="kv-post-caption-count">
                {caption.length}/{CAPTION_MAX}
              </span>
            </div>
          </div>

          {/* Canonical link */}
          <div className="kv-post-link-block mt-4">
            <label htmlFor="kv-post-link" className="kv-post-link-label">
              Canonical URL (optional)
            </label>
            <input
              id="kv-post-link"
              type="url"
              inputMode="url"
              placeholder="https://… (DMS link, IPFS URL, external system reference)"
              className="kv-post-link-input"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
            />
            <p className="kv-post-link-hint">
              This can point to the master copy of the contract, folder, or
              evidence bundle. It will be sealed alongside the files.
            </p>
          </div>

          {/* Legal details (only when postKind === "legal-contract") */}
          {postKind === "legal-contract" && (
            <div className="kv-post-legal-block mt-6">
              <div className="kv-post-legal-header">
                Legal details for this agreement
              </div>

              <div className="kv-post-legal-grid">
                <div className="kv-post-legal-field">
                  <label
                    htmlFor="kv-legal-title"
                    className="kv-post-legal-label"
                  >
                    Agreement title <span className="kv-post-legal-required">*</span>
                  </label>
                  <input
                    id="kv-legal-title"
                    type="text"
                    className="kv-post-legal-input"
                    placeholder="e.g. Master Services Agreement, NDA, Licensing Deal…"
                    value={legalTitle}
                    onChange={(e) => setLegalTitle(e.target.value)}
                  />
                </div>

                <div className="kv-post-legal-field">
                  <label
                    htmlFor="kv-legal-counterparty"
                    className="kv-post-legal-label"
                  >
                    Counterparty name{" "}
                    <span className="kv-post-legal-required">*</span>
                  </label>
                  <input
                    id="kv-legal-counterparty"
                    type="text"
                    className="kv-post-legal-input"
                    placeholder="Person or organization"
                    value={legalCounterparty}
                    onChange={(e) => setLegalCounterparty(e.target.value)}
                  />
                </div>

                <div className="kv-post-legal-field">
                  <label
                    htmlFor="kv-legal-email"
                    className="kv-post-legal-label"
                  >
                    Counterparty contact (optional)
                  </label>
                  <input
                    id="kv-legal-email"
                    type="email"
                    className="kv-post-legal-input"
                    placeholder="Email or contact handle"
                    value={legalEmail}
                    onChange={(e) => setLegalEmail(e.target.value)}
                  />
                </div>

                <div className="kv-post-legal-field">
                  <label
                    htmlFor="kv-legal-jurisdiction"
                    className="kv-post-legal-label"
                  >
                    Jurisdiction (optional)
                  </label>
                  <input
                    id="kv-legal-jurisdiction"
                    type="text"
                    className="kv-post-legal-input"
                    placeholder="e.g. Ontario, Canada • Delaware, USA • EU-wide…"
                    value={legalJurisdiction}
                    onChange={(e) =>
                      setLegalJurisdiction(e.target.value)
                    }
                  />
                </div>

                <div className="kv-post-legal-field">
                  <label
                    htmlFor="kv-legal-effective"
                    className="kv-post-legal-label"
                  >
                    Effective date (optional)
                  </label>
                  <input
                    id="kv-legal-effective"
                    type="date"
                    className="kv-post-legal-input"
                    value={legalEffectiveDate}
                    onChange={(e) =>
                      setLegalEffectiveDate(e.target.value)
                    }
                  />
                </div>

                <div className="kv-post-legal-field">
                  <label
                    htmlFor="kv-legal-ref"
                    className="kv-post-legal-label"
                  >
                    Reference code (optional)
                  </label>
                  <input
                    id="kv-legal-ref"
                    type="text"
                    className="kv-post-legal-input"
                    placeholder="Internal ID, contract number, matter code…"
                    value={legalReferenceCode}
                    onChange={(e) =>
                      setLegalReferenceCode(e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="kv-post-legal-flags mt-3">
                <label className="kv-post-legal-flag">
                  <input
                    type="checkbox"
                    checked={legalConfidential}
                    onChange={(e) =>
                      setLegalConfidential(e.target.checked)
                    }
                  />
                  <span>This agreement is confidential</span>
                </label>
                <label className="kv-post-legal-flag">
                  <input
                    type="checkbox"
                    checked={legalPersonalData}
                    onChange={(e) =>
                      setLegalPersonalData(e.target.checked)
                    }
                  />
                  <span>
                    This bundle includes personal data (names, addresses, IDs, etc.)
                  </span>
                </label>
              </div>

              <p className="kv-post-legal-hint mt-2">
                These details are sealed as metadata with the files and time
                pulse, creating a clear, timestamped record of what was agreed
                and with whom. This does not replace legal advice—use it as a
                hardened, auditable trail around your contracts.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="kv-post-actions w-full max-w-xl mt-4 flex justify-end">
        <button
          type="button"
          className="kv-post-submit-btn"
          onClick={handleProceed}
          disabled={!hasAttachments || isSubmitting}
        >
          {isSubmitting ? "Sealing…" : "Seal with Breath"}
        </button>
      </div>

      {/* Hidden input */}
      <input
        id="kv-post-file-input"
        type="file"
        multiple
        accept="*/*"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        className="kv-post-file-input"
      />
    </div>
  );
}
