// // import { useState, useCallback } from "react";
// // import { authFetch } from "../lib/apiFetch";
// // import toast from "react-hot-toast";

// // export interface UploadedImage {
// //   url: string;
// //   fileId: string;
// //   thumbnailUrl?: string;
// //   width?: number;
// //   height?: number;
// // }

// // interface ImageKitAuthResponse {
// //   token: string;
// //   expire: number;
// //   signature: string;
// //   publicKey: string;
// //   urlEndpoint: string;
// // }

// // interface UseImageUploadOptions {
// //   folder?: string;
// //   maxSizeMB?: number;
// //   onSuccess?: (image: UploadedImage) => void;
// //   onError?: (error: string) => void;
// // }

// // export function useImageUpload({
// //   folder = "/uploads",
// //   onSuccess,
// //   onError,
// // }: UseImageUploadOptions = {}) {
// //   const [uploading, setUploading] = useState(false);
// //   const [error, setError] = useState<string | null>(null);
// //   const [preview, setPreview] = useState<string | null>(null);
// //   const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);


// //   const upload = useCallback(
// //   async (file: File): Promise<UploadedImage | null> => {
// //     const objectUrl = URL.createObjectURL(file);
// //     setPreview(objectUrl);
// //     setUploading(true);
// //     setError(null);

// //     try {
// //       const authRes = await authFetch<ImageKitAuthResponse>("/uploads/imagekit-auth");
// //       const auth = authRes.data;

// //       const form = new FormData();
// //       form.append("file", file);
// //       form.append("fileName", (file.name || `image-${Date.now()}.jpg`).replace(/[^a-zA-Z0-9._-]/g, "_"));
// //       form.append("folder", folder || "/uploads");
// //       form.append("publicKey", auth.publicKey);
// //       form.append("signature", auth.signature);
// //       form.append("token", auth.token);
// //       form.append("expire", String(auth.expire));
// //       form.append("useUniqueFileName", "true");

// //       // Removed responseFields for testing

// //       const uploadRes = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
// //         method: "POST",
// //         body: form,
// //       });

// //       const responseText = await uploadRes.text();
// //       console.error(`ImageKit ${uploadRes.status}:`, responseText);

// //       if (!uploadRes.ok) {
// //         throw new Error(`Upload failed (${uploadRes.status}): ${responseText}`);
// //       }

// //       const data = JSON.parse(responseText);

// //       const image: UploadedImage = {
// //         url: data.url,
// //         fileId: data.fileId,
// //         thumbnailUrl: data.thumbnailUrl || data.url,
// //         width: data.width,
// //         height: data.height,
// //       };

// //       setPreview(image.url);
// //       setUploadedImage(image);
// //       onSuccess?.(image);
// //       toast.success("✅ Uploaded successfully");
// //       return image;

// //     } catch (err: any) {
// //       console.error("Full Upload Error:", err);
// //       const message = err.message || "Upload failed";
// //       setError(message);
// //       toast.error(message);
// //       return null;
// //     } finally {
// //       setUploading(false);
// //     }
// //   },
// //   [folder, onSuccess, onError]
// // );

// //   const remove = useCallback(() => {
// //     setPreview(null);
// //     setError(null);
// //     setUploadedImage(null);
// //   }, []);

// //   const reset = useCallback(() => {
// //     setPreview(null);
// //     setError(null);
// //     setUploading(false);
// //     setUploadedImage(null);
// //   }, []);

// //   return { preview, uploading, error, uploadedImage, upload, remove, reset };
// // }


// hooks/useImageUpload.ts
import { useState, useCallback } from "react";
import { authFetch } from "../lib/apiFetch";
import toast from "react-hot-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UploadedImage {
  url:           string;
  fileId:        string;
  thumbnailUrl?: string;
  width?:        number;
  height?:       number;
}

interface ImageKitAuthResponse {
  token:       string;
  expire:      number;
  signature:   string;
  publicKey:   string;
  urlEndpoint: string;
}

interface UseImageUploadOptions {
  folder?:    string;
  maxSizeMB?: number;
  onSuccess?: (image: UploadedImage) => void;
  onError?:   (error: string) => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useImageUpload({
  folder    = "/uploads",
  maxSizeMB = 10,
  onSuccess,
  onError,
}: UseImageUploadOptions = {}) {
  const [uploading,     setUploading]     = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [preview,       setPreview]       = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);

  const MAX_BYTES      = maxSizeMB * 1024 * 1024;
  const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

  const upload = useCallback(async (file: File): Promise<UploadedImage | null> => {

    // ── Validate ──────────────────────────────────────────────────────────────
    if (!ACCEPTED_TYPES.includes(file.type)) {
      const msg = "Only JPEG, PNG, WebP, and GIF are allowed.";
      setError(msg); onError?.(msg); toast.error(msg);
      return null;
    }
    if (file.size > MAX_BYTES) {
      const msg = `Image must be smaller than ${maxSizeMB} MB.`;
      setError(msg); onError?.(msg); toast.error(msg);
      return null;
    }

    // Optimistic blob preview — never base64
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);
    setError(null);

    try {
      // ── Step 1: fetch auth params from your backend ───────────────────────
      //
      // authFetch returns ApiResponse<T>:
      //   { success: true, message: "...", data: ImageKitAuthResponse }
      //
      // The controller uses sendSuccess(), so the fields are in .data — NOT
      // at the top level. This was the cause of "Incomplete auth response".
      //
      const envelope = await authFetch<ImageKitAuthResponse>("/uploads/imagekit/auth");
      const auth     = envelope.data;

      if (!auth?.token || !auth?.publicKey || !auth?.signature || !auth?.expire) {
        // Log the full envelope so you can see the real shape if this fires
        console.error("[useImageUpload] Unexpected auth envelope:", envelope);
        throw new Error(
          "Incomplete auth response from server. " +
          "Check that upload.controller uses sendSuccess() and that " +
          "IMAGEKIT_PUBLIC_KEY / IMAGEKIT_PRIVATE_KEY are set in .env"
        );
      }

      // ── Step 2: upload directly to ImageKit CDN ───────────────────────────
      // We append the raw File (binary multipart) — never base64.
      const form = new FormData();
      form.append("file",              file);
      form.append("fileName",
        (file.name || `upload-${Date.now()}.jpg`).replace(/[^a-zA-Z0-9._-]/g, "_")
      );
      form.append("folder",            folder);
      form.append("publicKey",         auth.publicKey);
      form.append("signature",         auth.signature);
      form.append("token",             auth.token);
      form.append("expire",            String(auth.expire));
      form.append("useUniqueFileName", "true");

      const uploadRes = await fetch(
        "https://upload.imagekit.io/api/v1/files/upload",
        { method: "POST", body: form }
      );

      // Read as text first — if ImageKit returns HTML on error,
      // calling .json() directly would throw "Unexpected token '<'"
      const rawText     = await uploadRes.text();
      const contentType = uploadRes.headers.get("content-type") ?? "";

      if (!uploadRes.ok || !contentType.includes("application/json")) {
        console.error(
          `[useImageUpload] ImageKit CDN ${uploadRes.status}:`,
          rawText.slice(0, 400)
        );
        throw new Error(
          uploadRes.status === 401
            ? "ImageKit rejected the upload — signature may be expired or keys are wrong."
            : `Upload failed (${uploadRes.status}). See console for details.`
        );
      }

      const data = JSON.parse(rawText) as {
        url?: string; fileId?: string;
        thumbnailUrl?: string; width?: number; height?: number;
      };

      if (!data.url) {
        console.error("[useImageUpload] Missing url in ImageKit response:", data);
        throw new Error("Upload succeeded but ImageKit returned no URL.");
      }

      const image: UploadedImage = {
        url:          data.url,
        fileId:       data.fileId ?? "",
        thumbnailUrl: data.thumbnailUrl || data.url,
        width:        data.width,
        height:       data.height,
      };

      URL.revokeObjectURL(objectUrl);   // free blob memory
      setPreview(image.url);
      setUploadedImage(image);
      onSuccess?.(image);
      toast.success("Image uploaded.");
      return image;

    } catch (err: unknown) {
      console.error("[useImageUpload] error:", err);
      URL.revokeObjectURL(objectUrl);
      const msg = err instanceof Error ? err.message : "Failed to upload image.";
      setError(msg);
      setPreview(null);
      onError?.(msg);
      toast.error(msg);
      return null;
    } finally {
      setUploading(false);
    }
  }, [folder, maxSizeMB, onSuccess, onError]);

  const remove = useCallback(() => {
    setPreview(null);
    setError(null);
    setUploadedImage(null);
  }, []);

  const reset = useCallback(() => {
    setPreview(null);
    setError(null);
    setUploading(false);
    setUploadedImage(null);
  }, []);

  return { preview, uploading, error, uploadedImage, upload, remove, reset };
}




// const UPLOAD_URL = "https://upload.imagekit.io/api/v1/files/upload";

// interface UploadImageKitOptions {
//   folder?: string;
//   fileName?: string;
// }

// interface UploadImageKitResult {
//   url: string;
//   fileId: string | null;
// }

// /**
//  * Upload a file directly to ImageKit from the browser.
//  *
//  * @param file     - Browser File object (from <input type="file">)
//  * @param getToken - async function that returns your API auth token
//  * @param opts     - optional folder and fileName overrides
//  */
// export async function uploadImageToImageKit(
//   file: File,
//   getToken: () => Promise<string>,
//   opts: UploadImageKitOptions = {},
// ): Promise<UploadImageKitResult> {
//   const { folder = "uploads", fileName } = opts;

//   // ── 1. Fetch ImageKit auth credentials from your backend ─────────────────
//   // Adjust this path to match wherever you mount your upload router.
//   // Path breakdown: /api/v1 (global prefix) + /uploads (uploadRoutes mount) + /imagekit/auth (route)
//   const authRes = await fetch("/api/v1/uploads/imagekit/auth", {
//     headers: {
//       Authorization: `Bearer ${await getToken()}`,
//     },
//   });

//   if (!authRes.ok) {
//     throw new Error(`Failed to fetch ImageKit auth: ${authRes.status}`);
//   }

//   const auth = await authRes.json() as {
//     token: string;
//     expire: number;
//     signature: string;
//     publicKey: string;
//     urlEndpoint: string;
//   };

//   // ── 2. Sanitise filename ──────────────────────────────────────────────────
//   const safeName =
//     fileName ??
//     (file.name.replace(/[^\w.-]/g, "_").slice(0, 200) || `upload-${Date.now()}.jpg`);

//   // ── 3. POST directly to ImageKit CDN ─────────────────────────────────────
//   const form = new FormData();
//   form.append("file", file);
//   form.append("fileName", safeName);
//   form.append("publicKey", auth.publicKey);
//   form.append("signature", auth.signature);
//   form.append("token", auth.token);
//   form.append("expire", String(auth.expire));
//   form.append("folder", folder);

//   const res = await fetch(UPLOAD_URL, { method: "POST", body: form });
//   const data = await res.json() as { url?: string; fileId?: string; message?: string };

//   if (!res.ok) {
//     console.error("[ImageKit upload] error", res.status, data);
//     throw new Error(data?.message ?? "ImageKit upload failed");
//   }

//   if (!data.url) {
//     console.error("[ImageKit upload] missing url in response", data);
//     throw new Error("ImageKit upload failed – no URL returned");
//   }

//   return { url: data.url, fileId: data.fileId ?? null };
// }