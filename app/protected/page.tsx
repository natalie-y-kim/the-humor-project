import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthControls } from "@/app/auth-controls";
import { createClient } from "@/lib/supabase/server";
import { voteOnCaption } from "@/app/protected/vote-actions";

type ImageRow = {
  id?: string | number | null;
  url?: string | null;
  created_datetime_utc?: string | null;
  is_public?: boolean | null;
};

type CaptionRow = {
  id?: string | number | null;
  content?: string | null;
  image_id?: string | number | null;
  is_public?: boolean | null;
  is_featured?: boolean | null;
  like_count?: number | null;
  created_datetime_utc?: string | null;
  images?: ImageRow | ImageRow[] | null;
};

type SearchParams = Record<string, string | string[] | undefined>;
type CaptionVoteRow = {
  caption_id?: string | null;
  vote_value?: number | null;
};

function getParam(params: SearchParams | undefined, key: string): string | undefined {
  const value = params?.[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProtectedPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const filterButtonStyle: React.CSSProperties = {
    display: "inline-block",
    padding: "8px 14px",
    border: "1px solid rgba(148, 163, 184, 0.18)",
    borderRadius: 999,
    background: "rgba(15, 23, 42, 0.45)",
    color: "#cbd5e1",
    textDecoration: "none",
    fontWeight: 600,
    fontSize: 14,
  };
  const activeFilterButtonStyle: React.CSSProperties = {
    border: "1px solid rgba(251, 191, 36, 0.45)",
    background: "rgba(251, 191, 36, 0.14)",
    color: "#fde68a",
  };
  const navButtonStyle: React.CSSProperties = {
    display: "inline-block",
    padding: "10px 16px",
    border: "1px solid rgba(251, 191, 36, 0.42)",
    borderRadius: 14,
    background: "linear-gradient(135deg, #fcd34d 0%, #fbbf24 55%, #f59e0b 100%)",
    color: "#1f2937",
    textDecoration: "none",
    fontWeight: 700,
    boxShadow: "0 12px 28px rgba(245, 158, 11, 0.24)",
  };
  const activeNavButtonStyle: React.CSSProperties = {
    border: "1px solid rgba(253, 230, 138, 0.7)",
    background: "linear-gradient(135deg, #fde68a 0%, #fcd34d 52%, #f59e0b 100%)",
    color: "#111827",
    boxShadow: "0 14px 34px rgba(245, 158, 11, 0.32)",
  };
  const homeButtonStyle: React.CSSProperties = {
    display: "inline-block",
    border: "1px solid #334155",
    background: "transparent",
    borderRadius: 999,
    padding: "8px 12px",
    color: "#94a3b8",
    textDecoration: "none",
    cursor: "pointer",
    fontSize: 14,
  };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const tableName = process.env.SUPABASE_TABLE ?? "captions";
  const resolvedSearchParams = await searchParams;
  const pageParam = getParam(resolvedSearchParams, "page");
  const indexParam = getParam(resolvedSearchParams, "index");
  const orderParam = getParam(resolvedSearchParams, "order") ?? "likes_desc";
  const featuredParam = getParam(resolvedSearchParams, "featured") ?? "false";
  const publicOnlyParam = getParam(resolvedSearchParams, "publicOnly") ?? "true";
  const isNewestSelected = featuredParam !== "true" && orderParam === "caption_created_desc";
  const isMostLikedSelected = featuredParam !== "true" && orderParam === "likes_desc";
  const isFeaturedSelected = featuredParam === "true";

  const page = Math.max(1, Number(pageParam ?? "1") || 1);
  const index = Math.max(0, Number(indexParam ?? "0") || 0);
  const perPage = 12;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from(tableName)
    .select(
      "id, content, image_id, is_public, is_featured, like_count, created_datetime_utc, images!inner ( id, url, created_datetime_utc, is_public )"
    );

  if (publicOnlyParam !== "false") {
    query = query.eq("is_public", true);
  }

  if (featuredParam === "true") {
    query = query.eq("is_featured", true);
  }

  query = query.eq("images.is_public", true);

  switch (orderParam) {
    case "likes_desc":
      query = query.order("like_count", { ascending: false }).order("created_datetime_utc", { ascending: false });
      break;
    case "image_created_desc":
      query = query
        .order("created_datetime_utc", { ascending: false, foreignTable: "images" })
        .order("created_datetime_utc", { ascending: false });
      break;
    case "caption_created_desc":
    default:
      query = query.order("created_datetime_utc", { ascending: false }).order("id", { ascending: false });
      break;
  }

  const { data, error } = featuredParam === "true" ? await query : await query.range(from, to);
  const captionIds =
    data
      ?.map((row) => (typeof row.id === "string" ? row.id : row.id != null ? String(row.id) : ""))
      .filter((id) => id.length > 0) ?? [];
  const votesByCaptionId = new Map<string, number>();

  if (captionIds.length > 0) {
    const { data: votes } = await supabase
      .from("caption_votes")
      .select("caption_id, vote_value")
      .eq("profile_id", user.id)
      .in("caption_id", captionIds);

    (votes as CaptionVoteRow[] | null)?.forEach((vote) => {
      if (typeof vote.caption_id === "string" && typeof vote.vote_value === "number") {
        votesByCaptionId.set(vote.caption_id, vote.vote_value);
      }
    });
  }

  const dataLength = data?.length ?? 0;
  const clampedIndex = dataLength > 0 ? Math.max(0, Math.min(index, dataLength - 1)) : 0;
  const hasPrevCaption = clampedIndex > 0;
  const hasNextCaption = clampedIndex < dataLength - 1;
  const showPrevPageButton = featuredParam !== "true" && !hasPrevCaption && page > 1;
  const showNextPageButton = featuredParam !== "true" && !hasNextCaption && dataLength === perPage;

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
        background: "#0f172a",
        color: "#e2e8f0",
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
          borderBottom: "1px solid rgba(51, 65, 85, 0.55)",
        }}
      >
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
          Discover
        </p>
        <div style={{ display: "grid", gap: 4 }}>
          <h1 style={{ margin: 0, fontSize: "clamp(32px, 5vw, 44px)", lineHeight: 1.05 }}>Vote and discover top captions</h1>
          <p style={{ margin: 0, color: "#94a3b8", fontSize: 15, lineHeight: 1.5 }}>
            Browse one caption at a time and rate what actually lands.
          </p>
        </div>
      </div>
      <div
        style={{
          width: "100%",
          maxWidth: 980,
          display: "grid",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
            paddingBottom: 12,
            borderBottom: "1px solid rgba(51, 65, 85, 0.38)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link
              href="/"
              style={{
                ...homeButtonStyle,
                padding: "6px 10px",
                color: "#64748b",
                fontSize: 13,
              }}
              className="protected-hover-button"
            >
              Home
            </Link>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "2px",
                borderBottom: "1px solid rgba(51, 65, 85, 0.8)",
              }}
            >
              <Link
                href={`/protected?order=likes_desc&featured=false&publicOnly=${publicOnlyParam}`}
                style={{
                  ...navButtonStyle,
                  ...activeNavButtonStyle,
                  padding: "10px 12px 12px",
                  border: "none",
                  borderBottom: "2px solid #fde68a",
                  borderRadius: 0,
                  background: "transparent",
                  color: "#fde68a",
                  boxShadow: "none",
                }}
                className="protected-hover-button"
              >
                Discover
              </Link>
              <Link
                href="/protected/upload"
                style={{
                  ...navButtonStyle,
                  padding: "10px 12px 12px",
                  border: "none",
                  borderBottom: "2px solid transparent",
                  borderRadius: 0,
                  background: "transparent",
                  color: "#94a3b8",
                  boxShadow: "none",
                }}
                className="protected-hover-button"
              >
                Create
              </Link>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: "auto" }}>
            <p style={{ margin: 0, color: "#64748b", textAlign: "right", fontSize: 14 }}>
              Signed in as {user.email ?? "Google user"}
            </p>
            <AuthControls isSignedIn variant="protected" />
          </div>
        </div>
        <div style={{ display: "grid", gap: 8, paddingTop: 2 }}>
          <p
            style={{
              margin: 0,
              color: "#64748b",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Sort captions
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a
              className="protected-hover-button"
              style={{ ...filterButtonStyle, ...(isNewestSelected ? activeFilterButtonStyle : {}) }}
              href={`/protected?order=caption_created_desc&featured=false&publicOnly=${publicOnlyParam}`}
            >
              Newest
            </a>
            <a
              className="protected-hover-button"
              style={{ ...filterButtonStyle, ...(isMostLikedSelected ? activeFilterButtonStyle : {}) }}
              href={`/protected?order=likes_desc&featured=false&publicOnly=${publicOnlyParam}`}
            >
              Most Liked
            </a>
            <a
              className="protected-hover-button"
              style={{ ...filterButtonStyle, ...(isFeaturedSelected ? activeFilterButtonStyle : {}) }}
              href={`/protected?order=${orderParam}&featured=true&publicOnly=${publicOnlyParam}`}
            >
              Featured
            </a>
          </div>
        </div>
      </div>
      {error ? (
        <p>Failed to load rows: {error.message}</p>
      ) : !data || data.length === 0 ? (
        <p>No rows found in "{tableName}".</p>
      ) : (
        (() => {
          const currentIndex = clampedIndex;
          const row = data[currentIndex] as CaptionRow;
          const image = Array.isArray(row.images) ? row.images[0] : row.images;
          const captionId = typeof row.id === "string" ? row.id : row.id != null ? String(row.id) : "";
          const currentVote = captionId ? votesByCaptionId.get(captionId) : undefined;
          return (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, width: "100%", maxWidth: 920 }}>
              <li
                key={row.id ?? currentIndex}
                style={{
                  border: "1px solid rgba(148, 163, 184, 0.22)",
                  borderRadius: 24,
                  padding: "18px 18px 20px",
                  background: "linear-gradient(180deg, rgba(17, 24, 39, 0.98) 0%, rgba(15, 23, 42, 0.98) 100%)",
                  boxShadow: "0 22px 60px rgba(2, 6, 23, 0.28)",
                  display: "grid",
                  gap: 18,
                }}
              >
                {image?.url ? (
                  <div
                    style={{
                      borderRadius: 18,
                      overflow: "hidden",
                      border: "1px solid rgba(148, 163, 184, 0.18)",
                      background: "#e5e7eb",
                    }}
                  >
                    <img
                      src={encodeURI(image.url)}
                      alt={row.content ?? "Caption image"}
                      style={{
                        display: "block",
                        width: "100%",
                        maxHeight: 500,
                        objectFit: "contain",
                        background: "#f3f4f6",
                      }}
                    />
                  </div>
                ) : null}
                <div style={{ display: "grid", gap: 12, justifyItems: "center", textAlign: "center" }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "#fcd34d",
                    }}
                  >
                    Caption candidate
                  </p>
                  <p
                    style={{
                      margin: 0,
                      maxWidth: 760,
                      fontSize: 30,
                      fontWeight: 800,
                      lineHeight: 1.25,
                      textAlign: "center",
                      color: "#f8fafc",
                    }}
                  >
                    {row.content ?? "(no caption)"}
                  </p>
                </div>
                {captionId ? (
                  <form
                    action={voteOnCaption}
                    style={{
                      display: "grid",
                      gap: 12,
                      justifyItems: "center",
                      padding: "16px",
                      borderRadius: 18,
                      background: "rgba(15, 23, 42, 0.76)",
                      border: "1px solid rgba(148, 163, 184, 0.16)",
                    }}
                  >
                    <input type="hidden" name="caption_id" value={captionId} />
                    <input type="hidden" name="current_page" value={page} />
                    <input type="hidden" name="current_index" value={currentIndex} />
                    <input type="hidden" name="total_in_page" value={data.length} />
                    <input type="hidden" name="order" value={orderParam} />
                    <input type="hidden" name="featured" value={featuredParam} />
                    <input type="hidden" name="publicOnly" value={publicOnlyParam} />
                    <p
                      style={{
                        margin: 0,
                        fontSize: 14,
                        lineHeight: 1.5,
                        color: "#cbd5e1",
                        textAlign: "center",
                      }}
                    >
                      Vote on whether this caption lands.
                    </p>
                    <div style={{ display: "flex", gap: 14, justifyContent: "center" }}>
                      <button
                        type="submit"
                        name="vote_value"
                        value="-1"
                        aria-label="Downvote"
                        className="protected-hover-button"
                        style={{
                          minWidth: 160,
                          padding: "14px 18px",
                          fontSize: 18,
                          fontWeight: 700,
                          borderRadius: 999,
                          border: currentVote === -1 ? "1px solid #ef4444" : "1px solid #334155",
                          background: currentVote === -1 ? "#7f1d1d" : "#111827",
                          color: currentVote === -1 ? "#fecaca" : "#e2e8f0",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 10,
                          cursor: "pointer",
                        }}
                      >
                        <span aria-hidden="true">👎</span>
                        <span>Not Funny</span>
                      </button>
                      <button
                        type="submit"
                        name="vote_value"
                        value="1"
                        aria-label="Upvote"
                        className="protected-hover-button"
                        style={{
                          minWidth: 160,
                          padding: "14px 18px",
                          fontSize: 18,
                          fontWeight: 700,
                          borderRadius: 999,
                          border: currentVote === 1 ? "1px solid #22c55e" : "1px solid #334155",
                          background: currentVote === 1 ? "#14532d" : "#111827",
                          color: currentVote === 1 ? "#bbf7d0" : "#e2e8f0",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 10,
                          cursor: "pointer",
                        }}
                      >
                        <span aria-hidden="true">👍</span>
                        <span>Funny</span>
                      </button>
                    </div>
                  </form>
                ) : null}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    gap: 10,
                    color: "#94a3b8",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  <span>
                    {featuredParam === "true" ? "Featured" : orderParam === "likes_desc" ? "Most liked" : "Newest"}
                  </span>
                  {orderParam === "likes_desc" ? <span>Likes: {row.like_count ?? 0}</span> : null}
                  <span>
                    {data.length > 0 ? `${currentIndex + 1} of ${data.length} on this page` : "No captions"}
                  </span>
                </div>
              </li>
            </ul>
          );
        })()
      )}

      <div style={{ display: "flex", width: "100%", maxWidth: 920 }}>
        {hasPrevCaption ? (
          <a
            className="protected-hover-button"
            style={navButtonStyle}
            href={`/protected?page=${page}&index=${clampedIndex - 1}&order=${orderParam}&featured=${featuredParam}&publicOnly=${publicOnlyParam}`}
          >
            ← Previous
          </a>
        ) : showPrevPageButton ? (
          <a
            className="protected-hover-button"
            style={navButtonStyle}
            href={`/protected?page=${page - 1}&index=0&order=${orderParam}&featured=${featuredParam}&publicOnly=${publicOnlyParam}`}
          >
            ← Previous
          </a>
        ) : null}
        {hasNextCaption ? (
          <a
            className="protected-hover-button"
            style={{ ...navButtonStyle, marginLeft: "auto" }}
            href={`/protected?page=${page}&index=${clampedIndex + 1}&order=${orderParam}&featured=${featuredParam}&publicOnly=${publicOnlyParam}`}
          >
            Next →
          </a>
        ) : showNextPageButton ? (
          <a
            className="protected-hover-button"
            style={{ ...navButtonStyle, marginLeft: "auto" }}
            href={`/protected?page=${page + 1}&index=0&order=${orderParam}&featured=${featuredParam}&publicOnly=${publicOnlyParam}`}
          >
            Next →
          </a>
        ) : null}
      </div>
    </main>
  );
}
