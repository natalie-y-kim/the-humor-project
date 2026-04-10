import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProtectedHeader } from "../ProtectedHeader";

type SearchParams = Record<string, string | string[] | undefined>;

type HistoryImageRow = {
  id?: string | number | null;
  url?: string | null;
  created_datetime_utc?: string | null;
};

type HistoryCaptionRow = {
  id?: string | number | null;
  content?: string | null;
  like_count?: number | null;
  is_public?: boolean | null;
  image_id?: string | number | null;
  created_datetime_utc?: string | null;
};

type HistoryEntry = {
  imageId: string;
  imageUrl: string | null;
  createdAt: string | null;
  captions: Array<{
    id: string;
    content: string | null;
    likeCount: number | null;
    isPublic: boolean | null;
  }>;
};

function getParam(params: SearchParams | undefined, key: string): string | undefined {
  const value = params?.[key];
  return Array.isArray(value) ? value[0] : value;
}

function truncateCaption(value: string | null | undefined, maxLength: number) {
  if (!value) return "(no caption)";
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trimEnd()}...`;
}

function formatHistoryDate(value: string | null) {
  if (!value) return "Recently created";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently created";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function buildHistoryHref({
  view,
  page,
  index,
}: {
  view: "list" | "detail";
  page: number;
  index: number;
}) {
  return `/protected/archive?view=${view}&page=${page}&index=${index}`;
}

export default async function ProtectedArchivePage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const navButtonStyle: React.CSSProperties = {
    display: "inline-block",
    padding: "10px 16px",
    border: "1px solid rgba(251, 191, 36, 0.42)",
    borderRadius: 14,
    background: "linear-gradient(135deg, #fcd34d 0%, #fbbf24 55%, #f59e0b 100%)",
    color: "var(--accent-text)",
    textDecoration: "none",
    fontWeight: 700,
    boxShadow: "0 12px 28px rgba(245, 158, 11, 0.24)",
  };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const resolvedSearchParams = await searchParams;
  const pageParam = getParam(resolvedSearchParams, "page");
  const indexParam = getParam(resolvedSearchParams, "index");
  const viewParam = getParam(resolvedSearchParams, "view");
  const view = viewParam === "detail" ? "detail" : "list";
  const page = Math.max(1, Number(pageParam ?? "1") || 1);
  const index = Math.max(0, Number(indexParam ?? "0") || 0);
  const perPage = 12;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const { data: imageRows } = await supabase
    .from("images")
    .select("id, url, created_datetime_utc")
    .eq("profile_id", user.id)
    .order("created_datetime_utc", { ascending: false })
    .range(from, to);

  const historyImages = (imageRows as HistoryImageRow[] | null) ?? [];
  const imageIds = historyImages
    .map((row) => (typeof row.id === "string" ? row.id : row.id != null ? String(row.id) : ""))
    .filter((id) => id.length > 0);

  const { data: captionRows } =
    imageIds.length > 0
      ? await supabase
          .from("captions")
          .select("id, content, like_count, is_public, image_id, created_datetime_utc")
          .eq("profile_id", user.id)
          .in("image_id", imageIds)
          .order("created_datetime_utc", { ascending: true })
      : { data: [] as HistoryCaptionRow[] };

  const captionsByImageId = new Map<string, HistoryEntry["captions"]>();

  (captionRows as HistoryCaptionRow[] | null)?.forEach((row) => {
    const imageId =
      typeof row.image_id === "string" ? row.image_id : row.image_id != null ? String(row.image_id) : "";

    if (!imageId) {
      return;
    }

    if (!captionsByImageId.has(imageId)) {
      captionsByImageId.set(imageId, []);
    }

    captionsByImageId.get(imageId)?.push({
      id: typeof row.id === "string" ? row.id : row.id != null ? String(row.id) : `${imageId}-${captionsByImageId.get(imageId)?.length ?? 0}`,
      content: row.content ?? null,
      likeCount: typeof row.like_count === "number" ? row.like_count : row.like_count != null ? Number(row.like_count) : null,
      isPublic: typeof row.is_public === "boolean" ? row.is_public : null,
    });
  });

  const history: HistoryEntry[] = historyImages.map((image) => {
    const imageId = typeof image.id === "string" ? image.id : image.id != null ? String(image.id) : "";

    return {
      imageId,
      imageUrl: image.url ?? null,
      createdAt: image.created_datetime_utc ?? null,
      captions: captionsByImageId.get(imageId) ?? [],
    };
  });

  const dataLength = history.length;
  const clampedIndex = dataLength > 0 ? Math.max(0, Math.min(index, dataLength - 1)) : 0;
  const currentEntry = dataLength > 0 ? history[clampedIndex] : null;
  const hasPrevGeneration = clampedIndex > 0;
  const hasNextGeneration = clampedIndex < dataLength - 1;
  const showPrevPageButton = !hasPrevGeneration && page > 1;
  const showNextPageButton = dataLength === perPage;

  return (
    <main
      style={{
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "center",
        minHeight: "100vh",
        flexDirection: "column",
        gap: "18px",
        padding: "20px 40px 32px",
        background: "var(--shell-bg)",
        color: "var(--text-primary)",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 980,
          display: "grid",
          gap: 8,
          paddingBottom: 4,
          borderBottom: "1px solid var(--border-default)",
        }}
      >
        <p
          style={{
            margin: 0,
            color: "var(--accent-strong)",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          History
        </p>
        <div style={{ display: "grid", gap: 4 }}>
          <h1 style={{ margin: 0, fontSize: "clamp(32px, 5vw, 44px)", lineHeight: 1.05 }}>
            Review your caption history
          </h1>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 15, lineHeight: 1.5 }}>
            Browse past generations one card at a time, then open one to review the full caption set.
          </p>
        </div>
      </div>

      <ProtectedHeader activeTab="history" userEmail={user.email} />

      {history.length === 0 ? (
        <section style={{ width: "100%", maxWidth: 920, display: "grid", gap: 14 }}>
          <div
            style={{
              padding: "18px",
              borderRadius: 20,
              border: "1px solid var(--border-default)",
              background: "var(--surface-soft)",
            }}
          >
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 14, lineHeight: 1.5 }}>
              Your previous caption generations will appear here after you create them.
            </p>
          </div>
        </section>
      ) : view === "list" ? (
        <section style={{ width: "100%", maxWidth: 980, display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gap: 4 }}>
            <p
              style={{
                margin: 0,
                color: "var(--text-muted)",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Browse generations
            </p>
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 14, lineHeight: 1.5 }}>
              Each card is one image upload and its generated caption set.
            </p>
          </div>

          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 14,
            }}
          >
            {history.map((entry, previewIndex) => (
              <li key={entry.imageId || previewIndex}>
                <Link
                  href={buildHistoryHref({ view: "detail", page, index: previewIndex })}
                  style={{
                    display: "grid",
                    gap: 12,
                    height: "100%",
                    padding: "14px",
                    borderRadius: 20,
                    border: "1px solid var(--border-default)",
                    background: "var(--surface-strong)",
                    textDecoration: "none",
                  }}
                  className="protected-hover-button discover-caption-card"
                >
                  <div
                    className="discover-caption-card-image"
                    style={{
                      aspectRatio: "4 / 3",
                      borderRadius: 14,
                      overflow: "hidden",
                      border: "1px solid var(--border-default)",
                      background: "var(--image-placeholder)",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    {entry.imageUrl ? (
                      <img
                        src={encodeURI(entry.imageUrl)}
                        alt="History generation preview"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    ) : (
                      <span style={{ color: "var(--text-muted)", fontSize: 13 }}>No image</span>
                    )}
                  </div>
                  <div style={{ display: "grid", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <span
                        style={{
                          color: "var(--text-muted)",
                          fontSize: 12,
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                        }}
                      >
                        Generation {previewIndex + 1}
                      </span>
                      <span style={{ color: "var(--text-secondary)", fontSize: 12, fontWeight: 700 }}>
                        {entry.captions.length} captions
                      </span>
                    </div>
                    <p
                      className="discover-caption-card-text"
                      style={{
                        margin: 0,
                        color: "var(--text-primary)",
                        fontSize: 18,
                        fontWeight: 700,
                        lineHeight: 1.35,
                      }}
                    >
                      {truncateCaption(entry.captions[0]?.content, 84)}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 8,
                        color: "var(--text-muted)",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      <span>{formatHistoryDate(entry.createdAt)}</span>
                      <span>Open generation</span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {showNextPageButton ? (
            <div style={{ display: "grid", justifyItems: "center", paddingTop: 50 }}>
              <a
                className="protected-hover-button"
                href={buildHistoryHref({ view: "list", page: page + 1, index: 0 })}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  padding: "20px 50px",
                  borderRadius: 999,
                  border: "1px solid rgba(251, 191, 36, 0.45)",
                  background: "rgba(251, 191, 36, 0.14)",
                  color: "var(--accent-text)",
                  textDecoration: "none",
                  fontSize: 17,
                  fontWeight: 700,
                }}
              >
                <span>See next 12 generations</span>
                <span aria-hidden="true">→</span>
              </a>
            </div>
          ) : null}
        </section>
      ) : currentEntry ? (
        <>
          <section style={{ width: "100%", maxWidth: 920, display: "grid", gap: 12 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div style={{ display: "grid", gap: 4 }}>
                <p
                  style={{
                    margin: 0,
                    color: "var(--text-muted)",
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  Review generation
                </p>
                <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 14, lineHeight: 1.5 }}>
                  Review every caption generated for this image.
                </p>
              </div>
              <Link
                href={buildHistoryHref({ view: "list", page, index: clampedIndex })}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid rgba(251, 191, 36, 0.45)",
                  background: "linear-gradient(135deg, #fcd34d 0%, #fbbf24 55%, #f59e0b 100%)",
                  borderRadius: 999,
                  padding: "10px 16px",
                  color: "var(--accent-text)",
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: 700,
                  boxShadow: "0 12px 28px rgba(245, 158, 11, 0.24)",
                }}
                className="protected-hover-button"
              >
                Back to list
              </Link>
            </div>

            <ul style={{ listStyle: "none", padding: 0, margin: 0, width: "100%" }}>
              <li
                style={{
                  border: "1px solid var(--border-default)",
                  borderRadius: 24,
                  padding: "18px 18px 20px",
                  background: "var(--surface-strong)",
                  boxShadow: "var(--shadow-soft)",
                  display: "grid",
                  gap: 18,
                }}
              >
                {currentEntry.imageUrl ? (
                  <div
                    style={{
                      borderRadius: 18,
                      overflow: "hidden",
                      border: "1px solid var(--border-default)",
                      background: "var(--image-placeholder)",
                    }}
                  >
                    <img
                      src={encodeURI(currentEntry.imageUrl)}
                      alt="History generation image"
                      style={{
                        display: "block",
                        width: "100%",
                        maxHeight: 500,
                        objectFit: "contain",
                        background: "var(--image-placeholder-strong)",
                      }}
                    />
                  </div>
                ) : null}

                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10, color: "var(--text-muted)", fontSize: 13, fontWeight: 600 }}>
                  <span>{formatHistoryDate(currentEntry.createdAt)}</span>
                  <span>{currentEntry.captions.length} captions generated</span>
                  <span>{dataLength > 0 ? `${clampedIndex + 1} of ${dataLength} on this page` : "No generations"}</span>
                </div>

                <ul
                  style={{
                    margin: 0,
                    padding: 0,
                    listStyle: "none",
                    display: "grid",
                    gap: 12,
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  }}
                >
                  {currentEntry.captions.map((caption, captionIndex) => (
                    <li
                      key={caption.id}
                      style={{
                        border: "1px solid var(--border-default)",
                        borderRadius: 20,
                        background: "var(--surface-soft)",
                        padding: "16px",
                        display: "grid",
                        gap: 12,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                        <p
                          style={{
                            margin: 0,
                            color: "var(--text-muted)",
                            fontWeight: 700,
                            fontSize: 12,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                          }}
                        >
                          Option {captionIndex + 1}
                        </p>
                        {typeof caption.likeCount === "number" ? (
                          <span
                            style={{
                              padding: "0.35rem 0.6rem",
                              borderRadius: 999,
                              background: "var(--surface-muted)",
                              color: "var(--text-secondary)",
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            {caption.likeCount} likes
                          </span>
                        ) : null}
                      </div>
                      <p style={{ margin: 0, fontSize: 22, fontWeight: 700, lineHeight: 1.4, color: "var(--text-primary)" }}>
                        {caption.content ?? "(no caption)"}
                      </p>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </section>

          <div style={{ display: "flex", width: "100%", maxWidth: 920 }}>
            {hasPrevGeneration ? (
              <a
                className="protected-hover-button"
                style={navButtonStyle}
                href={buildHistoryHref({ view: "detail", page, index: clampedIndex - 1 })}
              >
                ← Previous
              </a>
            ) : showPrevPageButton ? (
              <a
                className="protected-hover-button"
                style={navButtonStyle}
                href={buildHistoryHref({ view: "detail", page: page - 1, index: 0 })}
              >
                ← Previous
              </a>
            ) : null}

            {hasNextGeneration ? (
              <a
                className="protected-hover-button"
                style={{ ...navButtonStyle, marginLeft: "auto" }}
                href={buildHistoryHref({ view: "detail", page, index: clampedIndex + 1 })}
              >
                Next →
              </a>
            ) : showNextPageButton ? (
              <a
                className="protected-hover-button"
                style={{ ...navButtonStyle, marginLeft: "auto" }}
                href={buildHistoryHref({ view: "detail", page: page + 1, index: 0 })}
              >
                Next →
              </a>
            ) : null}
          </div>
        </>
      ) : null}
    </main>
  );
}
