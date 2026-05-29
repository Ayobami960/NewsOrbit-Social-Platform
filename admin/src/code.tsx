/**
 * components/editor/FeaturedImageUploader.tsx
 *
 * Drag-and-drop featured image uploader.
 * Used inside ArticleEditor sidebar.
 *
 * Props:
 *   articleId  – pass after the article is first saved so the upload endpoint has an ID
 *   value      – current featured image URL (from the saved article)
 *   onChange   – called with the new URL after a successful upload
 *                (for new articles not yet saved, stores a local preview only)
 */

import { useRef, useState, useCallback } from "react";
import { Upload, X, AlertCircle } from "lucide-react";

interface Props {
  articleId?: string;
  value?: string;
  onChange: (url: string) => void;
}

const MAX_MB   = 5;
const MAX_BYTES = MAX_MB * 1024 * 1024;
const ACCEPTED  = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default function FeaturedImageUploader({ articleId, value, onChange }: Props) {
  const inputRef          = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(value ?? null);

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = (file: File): string | null => {
    if (!ACCEPTED.includes(file.type)) return "Only JPEG, PNG, WebP or GIF allowed.";
    if (file.size > MAX_BYTES)         return `File must be under ${MAX_MB} MB.`;
    return null;
  };

  // ── Upload ─────────────────────────────────────────────────────────────────
  const upload = useCallback(async (file: File) => {
    const err = validate(file);
    if (err) { setError(err); return; }
    setError(null);

    // Always show a local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    if (!articleId) {
      // Article not saved yet — keep the blob preview; parent gets notified
      // with a placeholder so they know an image is pending upload.
      onChange("__pending__");
      return;
    }

    // Article exists — upload to server
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);

      const token = localStorage.getItem("accessToken") ?? "";
      const res   = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/articles/${articleId}/featured-image`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd }
      );

      if (!res.ok) throw new Error("Upload failed.");
      const json = await res.json();
      const url  = json?.data?.article?.featuredImage?.url ?? objectUrl;
      onChange(url);
      setPreview(url);
    } catch (e: any) {
      setError(e.message ?? "Upload failed.");
      setPreview(value ?? null);
    } finally {
      setUploading(false);
    }
  }, [articleId, onChange, value]);

  // ── Drag handlers ──────────────────────────────────────────────────────────
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  }, [upload]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = "";
  };

  const remove = () => {
    setPreview(null);
    onChange("");
    setError(null);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-2">
      {preview ? (
        <div className="relative group rounded-lg overflow-hidden border border-zinc-700">
          <img
            src={preview}
            alt="Featured"
            className="w-full object-cover aspect-video bg-zinc-800"
          />
          {uploading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!uploading && (
            <button
              type="button"
              onClick={remove}
              className="absolute top-2 right-2 bg-black/70 hover:bg-red-600 text-white p-1 rounded-full transition-colors opacity-0 group-hover:opacity-100"
            >
              <X size={12} />
            </button>
          )}
          {preview === "__pending__" && (
            <div className="absolute bottom-0 inset-x-0 bg-amber-900/80 text-amber-300 text-[10px] text-center py-1">
              Will upload after you save the article
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`
            flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed
            cursor-pointer transition-all duration-150 py-6
            ${dragging
              ? "border-red-500 bg-red-950/20"
              : "border-zinc-700 hover:border-zinc-500 bg-zinc-800/40 hover:bg-zinc-800/70"}
          `}
        >
          <div className={`p-2 rounded-full ${dragging ? "bg-red-900/40" : "bg-zinc-800"}`}>
            {uploading
              ? <div className="w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
              : <Upload size={16} className={dragging ? "text-red-400" : "text-zinc-500"} />
            }
          </div>
          <p className="text-xs text-zinc-500 text-center leading-relaxed">
            {dragging ? (
              <span className="text-red-400 font-medium">Drop to upload</span>
            ) : (
              <>
                <span className="text-zinc-300 font-medium">Click to upload</span>
                {" "}or drag & drop<br />
                <span className="text-zinc-600">JPEG, PNG, WebP, GIF · max {MAX_MB} MB</span>
              </>
            )}
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-400">
          <AlertCircle size={11} />
          {error}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        onChange={onFileChange}
        className="hidden"
      />
    </div>
  );
}