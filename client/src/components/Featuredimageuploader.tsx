

import { useRef, useCallback } from "react";
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle } from "lucide-react";
import { useImageUpload, type UploadedImage } from "../hooks/useImageUpload";

export type { UploadedImage };

interface Props {
  value: string;                                    
  onChange: (image: UploadedImage | null) => void;  
  folder?: string;
}

export default function FeaturedImageUploader({
  value,
  onChange,
  folder = "/blogs/featured",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const { preview, uploading, error, upload, remove } = useImageUpload({
    folder,
    maxSizeMB: 10,
    // onSuccess fires after ImageKit CDN upload completes.
    // We pass the resulting UploadedImage (url + fileId) up to the editor.
    // The raw File is NOT passed — the editor only needs the CDN result.
    onSuccess: (image) => onChange(image),
  });

  // displaySrc: show blob preview while uploading, fall back to saved URL
  const displaySrc = preview ?? (value || null);

  const handleFile = useCallback(
    (file: File) => {
      upload(file); // uploads to ImageKit CDN; onSuccess calls onChange(image)
    },
    [upload]
  );

  const handleRemove = () => {
    remove();
    onChange(null);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset so same file can be re-selected
    if (file) handleFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && !uploading) handleFile(file);
  };

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept="image/png,image/jpeg,image/webp,image/gif"
      className="hidden"
      onChange={onInputChange}
    />
  );

  // ── Image set (blob preview while uploading, or saved CDN URL) ─────────────
  if (displaySrc) {
    return (
      <div className="space-y-2">
        <div className="relative group rounded-lg overflow-hidden border border-zinc-700 bg-zinc-800">
          <img
            src={displaySrc}
            alt="Featured"
            className="w-full h-36 object-cover"
            loading="lazy"
            decoding="async"
          />

          {uploading && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
              <Loader2 size={22} className="text-white animate-spin" />
              <span className="text-xs text-white/80">Uploading…</span>
            </div>
          )}

          {!uploading && (
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex items-center gap-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-100 text-xs px-3 py-1.5 rounded-lg transition-colors"
              >
                <Upload size={12} /> Replace
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="flex items-center gap-1.5 bg-red-700 hover:bg-red-600 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
              >
                <X size={12} /> Remove
              </button>
            </div>
          )}
        </div>

        {error && (
          <p className="flex items-center gap-1.5 text-xs text-red-400" role="alert">
            <AlertCircle size={11} /> {error}
          </p>
        )}

        {fileInput}
      </div>
    );
  }

  // ── Empty drop zone ────────────────────────────────────────────────────────
  return (
    <div className="space-y-2">
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className={`
          flex flex-col items-center justify-center gap-2 w-full h-36
          border-2 border-dashed rounded-lg transition-colors
          ${
            uploading
              ? "border-zinc-600 cursor-wait opacity-60"
              : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-500 hover:bg-zinc-800 cursor-pointer"
          }
        `}
      >
        {uploading ? (
          <>
            <Loader2 size={22} className="text-red-400 animate-spin" />
            <span className="text-xs text-zinc-400">Uploading…</span>
          </>
        ) : (
          <>
            <ImageIcon size={22} className="text-zinc-600" />
            <span className="text-xs text-zinc-400 text-center leading-relaxed">
              Drop an image here or{" "}
              <span className="text-red-400 underline underline-offset-2">browse</span>
            </span>
            <span className="text-[10px] text-zinc-600">PNG · JPG · WebP · GIF · max 10 MB</span>
          </>
        )}
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-xs text-red-400" role="alert">
          <AlertCircle size={11} /> {error}
        </p>
      )}

      {fileInput}
    </div>
  );
}