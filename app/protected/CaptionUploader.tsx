"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  generateCaptions,
  generatePresignedUrl,
  registerImageUrl,
  uploadToPresignedUrl,
} from "@/lib/pipeline";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
]);

export function CaptionUploader() {
  const supabase = createClient();
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cdnUrl, setCdnUrl] = useState<string | null>(null);
  const [captions, setCaptions] = useState<any[]>([]);

  const onUpload = async () => {
    setError(null);

    if (!file) {
      setError("Please choose an image file.");
      return;
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      setError("Unsupported image type. Please use jpeg, jpg, png, webp, gif, or heic.");
      return;
    }

    setIsLoading(true);
    setCdnUrl(null);
    setCaptions([]);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        throw new Error("Missing auth access token. Please sign in again.");
      }

      const presigned = await generatePresignedUrl(accessToken, file.type);
      await uploadToPresignedUrl(presigned.presignedUrl, file);

      const registered = await registerImageUrl(accessToken, presigned.cdnUrl);
      const generatedCaptions = await generateCaptions(accessToken, registered.imageId);
      

      setCdnUrl(presigned.cdnUrl);
      setCaptions(generatedCaptions);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section
      style={{
        width: "100%",
        maxWidth: 720,
        border: "1px solid #334155",
        borderRadius: 8,
        background: "#111827",
        padding: "14px 16px",
        display: "grid",
        gap: 12,
      }}
    >
      <div style={{ display: "grid", gap: 4 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Upload Image</h2>
        <p style={{ margin: 0, color: "#94a3b8" }}>Upload an image and see what AI thinks is funny.</p>
      </div>

      <input
        type="file"
        accept="image/*"
        onChange={(event) => {
          const nextFile = event.target.files?.[0] ?? null;
          setFile(nextFile);
          setError(null);
        }}
      />

      <button
        type="button"
        onClick={onUpload}
        disabled={isLoading}
        className="protected-hover-button"
        style={{
          border: "1px solid #334155",
          background: "#1e293b",
          color: "#e2e8f0",
          borderRadius: 8,
          padding: "10px 14px",
          cursor: isLoading ? "not-allowed" : "pointer",
          opacity: isLoading ? 0.75 : 1,
          width: "fit-content",
        }}
      >
        {isLoading ? "Uploading..." : "Upload & Generate Captions"}
      </button>

      {error ? <p style={{ margin: 0, color: "#fca5a5" }}>{error}</p> : null}

      {cdnUrl ? (
        <img
          src={cdnUrl}
          alt="Uploaded preview"
          style={{
            width: "100%",
            maxHeight: 280,
            objectFit: "contain",
            borderRadius: 6,
            background: "#f3f4f6",
          }}
        />
      ) : null}

      {captions.length > 0 ? (
        <div style={{ display: "grid", gap: 8 }}>
          <p style={{ margin: 0, fontWeight: 700 }}>Caption Result:</p>
          <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "grid", gap: 8 }}>
            {captions.map((caption, index) => (
              <li
                key={`${index}-${typeof caption === "object" ? JSON.stringify(caption) : String(caption)}`}
                style={{
                  border: "1px solid #334155",
                  borderRadius: 8,
                  background: "#0f172a",
                  padding: "12px 14px",
                  display: "grid",
                  gap: 8,
                }}
              >
                <p style={{ margin: 0, color: "#94a3b8", fontWeight: 700 }}>Caption #{index + 1}</p>
                <p style={{ margin: 0, fontSize: 20, fontWeight: 700, lineHeight: 1.35, textAlign: "center" }}>
                  {caption?.content ?? JSON.stringify(caption)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
