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
        maxWidth: 920,
        border: "1px solid rgba(148, 163, 184, 0.22)",
        borderRadius: 24,
        background: "linear-gradient(180deg, rgba(17, 24, 39, 0.98) 0%, rgba(15, 23, 42, 0.98) 100%)",
        padding: "22px",
        display: "grid",
        gap: 20,
        boxShadow: "0 22px 60px rgba(2, 6, 23, 0.28)",
      }}
    >
      <div style={{ display: "grid", gap: 6 }}>
        <h2 style={{ margin: 0, fontSize: 24, lineHeight: 1.1 }}>Creation Flow</h2>
        <p style={{ margin: 0, color: "#94a3b8", fontSize: 15, lineHeight: 1.5 }}>
          Move from image upload to generated caption options in a guided three-step flow.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        }}
      >
        {[
          {
            step: "Step 1",
            title: "Choose image",
            detail: file ? file.name : "Pick a file to start a new caption set.",
            isActive: !file && !cdnUrl,
            isDone: Boolean(file),
          },
          {
            step: "Step 2",
            title: "Generate captions",
            detail: isLoading
              ? "Uploading image and generating caption options..."
              : captions.length > 0
                ? "Caption set generated successfully."
                : "Run generation after selecting an image.",
            isActive: Boolean(file) && !isLoading && captions.length === 0,
            isDone: captions.length > 0,
          },
          {
            step: "Step 3",
            title: "Review outputs",
            detail:
              captions.length > 0
                ? "Compare the generated caption cards below."
                : "Generated results will appear here for review.",
            isActive: captions.length > 0,
            isDone: captions.length > 0,
          },
        ].map((item) => (
          <div
            key={item.step}
            style={{
              display: "grid",
              gap: 10,
              padding: "16px",
              borderRadius: 18,
              border: item.isDone
                ? "1px solid rgba(251, 191, 36, 0.36)"
                : item.isActive
                  ? "1px solid rgba(148, 163, 184, 0.34)"
                  : "1px solid rgba(148, 163, 184, 0.14)",
              background: item.isDone
                ? "rgba(120, 53, 15, 0.22)"
                : item.isActive
                  ? "rgba(30, 41, 59, 0.72)"
                  : "rgba(15, 23, 42, 0.48)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <p
                style={{
                  margin: 0,
                  color: item.isDone ? "#fde68a" : "#94a3b8",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {item.step}
              </p>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: item.isDone ? "#fbbf24" : item.isActive ? "#cbd5e1" : "#334155",
                  flexShrink: 0,
                }}
              />
            </div>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#f8fafc" }}>{item.title}</p>
            <p style={{ margin: 0, color: "#cbd5e1", fontSize: 14, lineHeight: 1.5 }}>{item.detail}</p>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gap: 16,
          padding: "18px",
          borderRadius: 20,
          border: "1px solid rgba(148, 163, 184, 0.18)",
          background: "rgba(15, 23, 42, 0.42)",
        }}
      >
        <div style={{ display: "grid", gap: 6 }}>
          <p
            style={{
              margin: 0,
              color: "#fcd34d",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Step 1
          </p>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Choose an image</p>
          <p style={{ margin: 0, color: "#94a3b8", fontSize: 14, lineHeight: 1.5 }}>
            Upload a single image to generate a fresh set of caption options.
          </p>
        </div>

        <input
          type="file"
          accept="image/*"
          onChange={(event) => {
            const nextFile = event.target.files?.[0] ?? null;
            setFile(nextFile);
            setError(null);
          }}
          style={{
            border: "1px dashed rgba(148, 163, 184, 0.32)",
            borderRadius: 16,
            padding: "14px",
            background: "rgba(30, 41, 59, 0.7)",
            color: "#e2e8f0",
          }}
        />

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
          <button
            type="button"
            onClick={onUpload}
            disabled={isLoading}
            className="protected-hover-button"
            style={{
              border: "1px solid rgba(251, 191, 36, 0.45)",
              background: "linear-gradient(135deg, #fcd34d 0%, #f59e0b 100%)",
              color: "#1f2937",
              borderRadius: 999,
              padding: "12px 18px",
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.75 : 1,
              fontWeight: 800,
              boxShadow: "0 14px 30px rgba(245, 158, 11, 0.24)",
            }}
          >
            {isLoading ? "Uploading..." : "Upload & Generate Captions"}
          </button>
          <p style={{ margin: 0, color: "#94a3b8", fontSize: 14 }}>
            {file ? `Selected: ${file.name}` : "No image selected yet."}
          </p>
        </div>
      </div>

      {error ? <p style={{ margin: 0, color: "#fca5a5" }}>{error}</p> : null}

      {cdnUrl ? (
        <div
          style={{
            display: "grid",
            gap: 12,
            padding: "18px",
            borderRadius: 20,
            border: "1px solid rgba(148, 163, 184, 0.18)",
            background: "rgba(15, 23, 42, 0.42)",
          }}
        >
          <div style={{ display: "grid", gap: 6 }}>
            <p
              style={{
                margin: 0,
                color: "#fcd34d",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Step 2
            </p>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Generate captions</p>
            <p style={{ margin: 0, color: "#94a3b8", fontSize: 14, lineHeight: 1.5 }}>
              Your uploaded image is ready. Review the generated caption set below.
            </p>
          </div>
          <img
            src={cdnUrl}
            alt="Uploaded preview"
            style={{
              width: "100%",
              maxHeight: 320,
              objectFit: "contain",
              borderRadius: 16,
              background: "#f3f4f6",
            }}
          />
        </div>
      ) : null}

      {captions.length > 0 ? (
        <div style={{ display: "grid", gap: 14 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <p
              style={{
                margin: 0,
                color: "#fcd34d",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Step 3
            </p>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Review caption outputs</p>
            <p style={{ margin: 0, color: "#94a3b8", fontSize: 14, lineHeight: 1.5 }}>
              Compare the generated options below and decide which direction is strongest.
            </p>
          </div>
          <ul
            style={{
              margin: 0,
              paddingLeft: 0,
              listStyle: "none",
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            }}
          >
            {captions.map((caption, index) => (
              <li
                key={`${index}-${typeof caption === "object" ? JSON.stringify(caption) : String(caption)}`}
                style={{
                  border: "1px solid rgba(148, 163, 184, 0.18)",
                  borderRadius: 20,
                  background: "linear-gradient(180deg, rgba(17, 24, 39, 0.92) 0%, rgba(15, 23, 42, 0.96) 100%)",
                  padding: "16px",
                  display: "grid",
                  gap: 12,
                  boxShadow: "0 16px 34px rgba(2, 6, 23, 0.2)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <p
                    style={{
                      margin: 0,
                      color: "#94a3b8",
                      fontWeight: 700,
                      fontSize: 12,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    Option {index + 1}
                  </p>
                  <span
                    style={{
                      padding: "0.35rem 0.6rem",
                      borderRadius: 999,
                      background: "rgba(148, 163, 184, 0.12)",
                      color: "#cbd5e1",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    Result Card
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 700, lineHeight: 1.4, textAlign: "left", color: "#f8fafc" }}>
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
