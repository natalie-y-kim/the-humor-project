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
    border: "1px solid #334155",
    borderRadius: 12,
    background: "#1e293b",
    color: "#e2e8f0",
    textDecoration: "none",
    fontWeight: 600,
  };
  const navButtonStyle: React.CSSProperties = {
    display: "inline-block",
    padding: "8px 14px",
    border: "1px solid #334155",
    borderRadius: 12,
    background: "#1e293b",
    color: "#e2e8f0",
    textDecoration: "none",
    fontWeight: 600,
  };
  const homeButtonStyle: React.CSSProperties = {
    display: "inline-block",
    border: "1px solid #334155",
    background: "#1e293b",
    borderRadius: 8,
    padding: "10px 14px",
    color: "#e2e8f0",
    textDecoration: "none",
    cursor: "pointer",
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
        gap: "12px",
        padding: "20px 40px 32px",
        background: "#0f172a",
        color: "#e2e8f0",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1>Captions</h1>
      <div
        style={{
          width: "100%",
          maxWidth: 980,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: 12,
          marginTop: -4,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/" style={homeButtonStyle} className="protected-hover-button">
            Home
          </Link>
          <Link
            href={`/protected?order=likes_desc&featured=false&publicOnly=${publicOnlyParam}`}
            style={homeButtonStyle}
            className="protected-hover-button"
          >
            Vote Captions
          </Link>
          <Link href="/protected/upload" style={homeButtonStyle} className="protected-hover-button">
            Upload Image
          </Link>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: "auto" }}>
          <p style={{ margin: 0, color: "#94a3b8", textAlign: "right" }}>Signed in as {user.email ?? "Google user"}</p>
          <AuthControls isSignedIn variant="protected" />
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 4 }}>
        <a
          className="protected-hover-button"
          style={filterButtonStyle}
          href={`/protected?order=caption_created_desc&featured=false&publicOnly=${publicOnlyParam}`}
        >
          Newest Captions
        </a>
        <a
          className="protected-hover-button"
          style={filterButtonStyle}
          href={`/protected?order=likes_desc&featured=false&publicOnly=${publicOnlyParam}`}
        >
          Most Liked
        </a>
        <a
          className="protected-hover-button"
          style={filterButtonStyle}
          href={`/protected?order=${orderParam}&featured=true&publicOnly=${publicOnlyParam}`}
        >
          Featured Only
        </a>
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
            <ul style={{ listStyle: "none", padding: 0, margin: 0, width: "100%", maxWidth: 720 }}>
              <li
                key={row.id ?? currentIndex}
                style={{
                  border: "1px solid #334155",
                  borderRadius: 8,
                  padding: "12px 16px",
                  background: "#111827",
                }}
              >
                {image?.url ? (
                  <img
                    src={encodeURI(image.url)}
                    alt={row.content ?? "Caption image"}
                    style={{
                      width: "100%",
                      maxHeight: 220,
                      objectFit: "contain",
                      borderRadius: 6,
                      background: "#f3f4f6",
                    }}
                  />
                ) : null}
                <p
                  style={{
                    margin: "14px 0 0",
                    fontSize: 24,
                    fontWeight: 700,
                    lineHeight: 1.35,
                    textAlign: "center",
                  }}
                >
                  {row.content ?? "(no caption)"}
                </p>
                {orderParam === "likes_desc" ? (
                  <p style={{ margin: "8px 0 0", textAlign: "center", color: "#94a3b8", fontWeight: 600 }}>
                    Likes: {row.like_count ?? 0}
                  </p>
                ) : null}
                {captionId ? (
                  <form
                    action={voteOnCaption}
                    style={{ display: "flex", gap: 12, marginTop: 14, justifyContent: "center" }}
                  >
                    <input type="hidden" name="caption_id" value={captionId} />
                    <input type="hidden" name="current_page" value={page} />
                    <input type="hidden" name="current_index" value={currentIndex} />
                    <input type="hidden" name="total_in_page" value={data.length} />
                    <input type="hidden" name="order" value={orderParam} />
                    <input type="hidden" name="featured" value={featuredParam} />
                    <input type="hidden" name="publicOnly" value={publicOnlyParam} />
                    <button
                      type="submit"
                      name="vote_value"
                      value="-1"
                      aria-label="Downvote"
                      className="protected-hover-button"
                      style={{
                        width: 56,
                        height: 56,
                        fontSize: 24,
                        fontWeight: 700,
                        borderRadius: "50%",
                        border: currentVote === -1 ? "1px solid #ef4444" : "1px solid #334155",
                        background: currentVote === -1 ? "#7f1d1d" : "#111827",
                        color: currentVote === -1 ? "#fecaca" : "#e2e8f0",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                    >
                      👎
                    </button>
                    <button
                      type="submit"
                      name="vote_value"
                      value="1"
                      aria-label="Upvote"
                      className="protected-hover-button"
                      style={{
                        width: 56,
                        height: 56,
                        fontSize: 24,
                        fontWeight: 700,
                        borderRadius: "50%",
                        border: currentVote === 1 ? "1px solid #22c55e" : "1px solid #334155",
                        background: currentVote === 1 ? "#14532d" : "#111827",
                        color: currentVote === 1 ? "#bbf7d0" : "#e2e8f0",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                    >
                      👍
                    </button>
                  </form>
                ) : null}
              </li>
            </ul>
          );
        })()
      )}

      <div style={{ display: "flex", width: "100%", maxWidth: 720 }}>
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
