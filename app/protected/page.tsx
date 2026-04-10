import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { voteOnCaption } from "@/app/protected/vote-actions";
import { AutoAdvanceOnVote } from "@/app/protected/AutoAdvanceOnVote";
import { ProtectedHeader } from "@/app/protected/ProtectedHeader";

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

function truncateCaption(value: string | null | undefined, maxLength: number) {
  if (!value) return "(no caption)";
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trimEnd()}...`;
}

function buildProtectedHref({
  view,
  page,
  index,
  voteState,
  order,
  featured,
  publicOnly,
}: {
  view: "list" | "detail";
  page: number;
  index: number;
  voteState: string;
  order: string;
  featured: string;
  publicOnly: string;
}) {
  return `/protected?view=${view}&page=${page}&index=${index}&voteState=${voteState}&order=${order}&featured=${featured}&publicOnly=${publicOnly}`;
}

export default async function ProtectedPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const activityFilterButtonStyle: React.CSSProperties = {
    display: "inline-block",
    padding: "7px 12px",
    border: "1px solid rgba(100, 116, 139, 0.18)",
    borderRadius: 999,
    background: "transparent",
    color: "var(--button-text-muted)",
    textDecoration: "none",
    fontWeight: 600,
    fontSize: 13,
  };
  const activeActivityFilterButtonStyle: React.CSSProperties = {
    border: "1px solid rgba(251, 191, 36, 0.45)",
    background: "rgba(251, 191, 36, 0.14)",
    color: "var(--accent-text)",
  };
  const filterButtonStyle: React.CSSProperties = {
    display: "inline-block",
    padding: "8px 14px",
    border: "1px solid rgba(100, 116, 139, 0.18)",
    borderRadius: 999,
    background: "transparent",
    color: "var(--button-text-muted)",
    textDecoration: "none",
    fontWeight: 600,
    fontSize: 14,
  };
  const activeFilterButtonStyle: React.CSSProperties = {
    border: "1px solid rgba(251, 191, 36, 0.45)",
    background: "rgba(251, 191, 36, 0.14)",
    color: "var(--accent-text)",
  };
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

  const tableName = process.env.SUPABASE_TABLE ?? "captions";
  const resolvedSearchParams = await searchParams;
  const pageParam = getParam(resolvedSearchParams, "page");
  const indexParam = getParam(resolvedSearchParams, "index");
  const viewParam = getParam(resolvedSearchParams, "view");
  const voteStateParam = getParam(resolvedSearchParams, "voteState");
  const justVotedParam = getParam(resolvedSearchParams, "justVoted");
  const autoAdvanceParam = getParam(resolvedSearchParams, "autoAdvance");
  const submittedVoteParam = getParam(resolvedSearchParams, "submittedVote");
  const voteStatusParam = getParam(resolvedSearchParams, "voteStatus");
  const orderParam = getParam(resolvedSearchParams, "order") ?? "likes_desc";
  const featuredParam = getParam(resolvedSearchParams, "featured") ?? "false";
  const publicOnlyParam = getParam(resolvedSearchParams, "publicOnly") ?? "true";
  const view = viewParam === "detail" ? "detail" : "list";
  const voteState =
    voteStateParam === "voted" || voteStateParam === "not_voted" ? voteStateParam : "all";
  const isNewestSelected = featuredParam !== "true" && orderParam === "caption_created_desc";
  const isMostLikedSelected = featuredParam !== "true" && orderParam === "likes_desc";
  const isFeaturedSelected = featuredParam === "true";
  const isAllActivitySelected = voteState === "all";
  const isNotVotedActivitySelected = voteState === "not_voted";
  const isVotedActivitySelected = voteState === "voted";
  const justVoted = justVotedParam === "1";
  const autoAdvanceEnabled = autoAdvanceParam === "1";
  const submittedVote =
    submittedVoteParam === "1" || submittedVoteParam === "-1" ? Number(submittedVoteParam) : null;
  const voteStatus =
    voteStatusParam === "saved" || voteStatusParam === "updated" || voteStatusParam === "removed"
      ? voteStatusParam
      : null;

  const page = Math.max(1, Number(pageParam ?? "1") || 1);
  const index = Math.max(0, Number(indexParam ?? "0") || 0);
  const perPage = 12;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  let votedCaptionIds: string[] = [];

  if (voteState !== "all") {
    const { data: userVotes } = await supabase
      .from("caption_votes")
      .select("caption_id")
      .eq("profile_id", user.id);

    votedCaptionIds =
      (userVotes as Array<{ caption_id?: string | null }> | null)
        ?.map((row) => (typeof row.caption_id === "string" ? row.caption_id : ""))
        .filter((id) => id.length > 0) ?? [];
  }

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

  if (voteState === "voted") {
    if (votedCaptionIds.length === 0) {
      query = query.in("id", ["__no_matching_caption_ids__"]);
    } else {
      query = query.in("id", votedCaptionIds);
    }
  }

  if (voteState === "not_voted" && votedCaptionIds.length > 0) {
    const escapedIds = votedCaptionIds.map((id) => `"${id.split('"').join('\\"')}"`).join(",");
    query = query.not("id", "in", `(${escapedIds})`);
  }

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

  const filteredData = (data as CaptionRow[] | null) ?? [];

  const dataLength = filteredData.length;
  const clampedIndex = dataLength > 0 ? Math.max(0, Math.min(index, dataLength - 1)) : 0;
  const hasPrevCaption = clampedIndex > 0;
  const hasNextCaption = clampedIndex < dataLength - 1;
  const showPrevPageButton = featuredParam !== "true" && !hasPrevCaption && page > 1;
  const showNextPageButton = featuredParam !== "true" && !hasNextCaption && dataLength === perPage;
  const showListNextPageButton = featuredParam !== "true" && dataLength === perPage;
  const nextDetailHref = hasNextCaption
    ? buildProtectedHref({
        view: "detail",
        page,
        index: clampedIndex + 1,
        voteState,
        order: orderParam,
        featured: featuredParam,
        publicOnly: publicOnlyParam,
      })
    : showNextPageButton
      ? buildProtectedHref({
          view: "detail",
          page: page + 1,
          index: 0,
          voteState,
          order: orderParam,
          featured: featuredParam,
          publicOnly: publicOnlyParam,
        })
      : null;

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
          Discover
        </p>
        <div style={{ display: "grid", gap: 4 }}>
          <h1 style={{ margin: 0, fontSize: "clamp(32px, 5vw, 44px)", lineHeight: 1.05 }}>Vote and discover top captions</h1>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 15, lineHeight: 1.5 }}>
            Browse one caption at a time and rate what actually lands.
          </p>
        </div>
      </div>
      <ProtectedHeader activeTab="discover" userEmail={user.email} />
      <div
        style={{
          width: "100%",
          maxWidth: 980,
          display: "grid",
          gap: 12,
        }}
      >
        <div style={{ display: "grid", gap: 8, paddingTop: 2 }}>
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
            Sort captions
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a
              className="protected-hover-button"
              style={{ ...filterButtonStyle, ...(isNewestSelected ? activeFilterButtonStyle : {}) }}
              href={`/protected?view=list&voteState=${voteState}&order=caption_created_desc&featured=false&publicOnly=${publicOnlyParam}`}
            >
              Newest
            </a>
            <a
              className="protected-hover-button"
              style={{ ...filterButtonStyle, ...(isMostLikedSelected ? activeFilterButtonStyle : {}) }}
              href={`/protected?view=list&voteState=${voteState}&order=likes_desc&featured=false&publicOnly=${publicOnlyParam}`}
            >
              Most Liked
            </a>
            <a
              className="protected-hover-button"
              style={{ ...filterButtonStyle, ...(isFeaturedSelected ? activeFilterButtonStyle : {}) }}
              href={`/protected?view=list&voteState=${voteState}&order=${orderParam}&featured=true&publicOnly=${publicOnlyParam}`}
            >
              Featured
            </a>
          </div>
        </div>
        <div style={{ display: "grid", gap: 8 }}>
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
            Your activity
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a
              className="protected-hover-button"
              style={{ ...activityFilterButtonStyle, ...(isAllActivitySelected ? activeActivityFilterButtonStyle : {}) }}
              href={`/protected?view=list&voteState=all&order=${orderParam}&featured=${featuredParam}&publicOnly=${publicOnlyParam}`}
            >
              All
            </a>
            <a
              className="protected-hover-button"
              style={{
                ...activityFilterButtonStyle,
                ...(isNotVotedActivitySelected ? activeActivityFilterButtonStyle : {}),
              }}
              href={`/protected?view=list&voteState=not_voted&order=${orderParam}&featured=${featuredParam}&publicOnly=${publicOnlyParam}`}
            >
              Not voted
            </a>
            <a
              className="protected-hover-button"
              style={{ ...activityFilterButtonStyle, ...(isVotedActivitySelected ? activeActivityFilterButtonStyle : {}) }}
              href={`/protected?view=list&voteState=voted&order=${orderParam}&featured=${featuredParam}&publicOnly=${publicOnlyParam}`}
            >
              Voted
            </a>
          </div>
        </div>
      </div>
      {error ? (
        <p>Failed to load rows: {error.message}</p>
      ) : !data || data.length === 0 ? (
        <p>No rows found in "{tableName}".</p>
      ) : dataLength === 0 ? (
        <p>
          {voteState === "voted"
            ? "No voted captions in this set."
            : voteState === "not_voted"
              ? "No unvoted captions in this set."
              : `No rows found in "${tableName}".`}
        </p>
      ) : (
        (() => {
          const currentIndex = clampedIndex;
          const row = filteredData[currentIndex] as CaptionRow;
          const image = Array.isArray(row.images) ? row.images[0] : row.images;
          const captionId = typeof row.id === "string" ? row.id : row.id != null ? String(row.id) : "";
          const currentVote = captionId ? votesByCaptionId.get(captionId) : undefined;
          if (view === "list") {
            return (
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
                    Browse captions
                  </p>
                  <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 14, lineHeight: 1.5 }}>
                    Browse this set of 12 captions, then open one to review and vote.
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
                  {filteredData.map((previewRow, previewIndex) => {
                    const previewImage = Array.isArray(previewRow.images) ? previewRow.images[0] : previewRow.images;
                    const previewId =
                      typeof previewRow.id === "string"
                        ? previewRow.id
                        : previewRow.id != null
                          ? String(previewRow.id)
                          : "";
                    const previewVote = previewId ? votesByCaptionId.get(previewId) : undefined;

                    return (
                      <li key={previewId || previewIndex}>
                        <Link
                          href={`/protected?view=detail&page=${page}&index=${previewIndex}&voteState=${voteState}&order=${orderParam}&featured=${featuredParam}&publicOnly=${publicOnlyParam}`}
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
                            {previewImage?.url ? (
                              <img
                                src={encodeURI(previewImage.url)}
                                alt={previewRow.content ?? "Caption preview image"}
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
                                {previewIndex + 1}
                              </span>
                              {previewVote === 1 ? (
                                <span style={{ color: "var(--positive-text)", fontSize: 12, fontWeight: 700 }}>You voted funny</span>
                              ) : previewVote === -1 ? (
                                <span style={{ color: "var(--negative-text)", fontSize: 12, fontWeight: 700 }}>You voted not funny</span>
                              ) : null}
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
                              {truncateCaption(previewRow.content, 84)}
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
                              <span>
                                {previewRow.is_featured ? "Featured" : orderParam === "likes_desc" ? "Most liked" : "Newest"}
                              </span>
                              {typeof previewRow.like_count === "number" ? <span>{previewRow.like_count} likes</span> : null}
                            </div>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                {showListNextPageButton ? (
                  <div style={{ display: "grid", justifyItems: "center", paddingTop: 50 }}>
                    <a
                      className="protected-hover-button"
                      href={`/protected?view=list&page=${page + 1}&index=0&voteState=${voteState}&order=${orderParam}&featured=${featuredParam}&publicOnly=${publicOnlyParam}`}
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
                      <span>See next 12 captions</span>
                      <span aria-hidden="true">→</span>
                    </a>
                  </div>
                ) : null}
              </section>
            );
          }

          return (
            <section style={{ width: "100%", maxWidth: 920, display: "grid", gap: 12 }}>
              <AutoAdvanceOnVote enabled={justVoted && autoAdvanceEnabled && view === "detail"} nextHref={nextDetailHref} />
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
                    Vote on caption
                  </p>
                  <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 14, lineHeight: 1.5 }}>
                    Review the full caption and vote on whether it actually lands.
                  </p>
                </div>
                <Link
                  href={buildProtectedHref({
                    view: "list",
                    page,
                    index: currentIndex,
                    voteState,
                    order: orderParam,
                    featured: featuredParam,
                    publicOnly: publicOnlyParam,
                  })}
                  style={{
                    display: "inline-block",
                    border: "1px solid var(--border-default)",
                    background: "transparent",
                    borderRadius: 999,
                    padding: "8px 12px",
                    color: "var(--button-text-muted)",
                    textDecoration: "none",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                  className="protected-hover-button"
                >
                  Back to list
                </Link>
              </div>
              {justVoted ? (
                <p
                  style={{
                    margin: 0,
                    color:
                      voteStatus === "removed"
                        ? "var(--text-muted)"
                        : submittedVote === 1
                          ? "var(--positive-text)"
                          : submittedVote === -1
                            ? "var(--negative-text)"
                            : "var(--text-muted)",
                    fontSize: 14,
                    fontWeight: 600,
                    textAlign: "center",
                  }}
                >
                  {voteStatus === "removed"
                    ? "Vote removed."
                    : autoAdvanceEnabled && nextDetailHref
                      ? "Vote recorded. Moving to next caption..."
                      : "Vote recorded."}
                </p>
              ) : null}
              <ul style={{ listStyle: "none", padding: 0, margin: 0, width: "100%" }}>
                <li
                  key={row.id ?? currentIndex}
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
                  {image?.url ? (
                    <div
                      style={{
                        borderRadius: 18,
                        overflow: "hidden",
                        border: "1px solid var(--border-default)",
                        background: "var(--image-placeholder)",
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
                          background: "var(--image-placeholder-strong)",
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
                        color: "var(--accent-strong)",
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
                        color: "var(--text-primary)",
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
                        background: "var(--surface-soft)",
                        border: "1px solid var(--border-default)",
                      }}
                    >
                      <input type="hidden" name="caption_id" value={captionId} />
                      <input type="hidden" name="current_page" value={page} />
                      <input type="hidden" name="current_index" value={currentIndex} />
                      <input type="hidden" name="total_in_page" value={filteredData.length} />
                      <input type="hidden" name="view" value="detail" />
                      <input type="hidden" name="voteState" value={voteState} />
                      <input type="hidden" name="order" value={orderParam} />
                      <input type="hidden" name="featured" value={featuredParam} />
                      <input type="hidden" name="publicOnly" value={publicOnlyParam} />
                      <p
                        style={{
                          margin: 0,
                          fontSize: 14,
                          lineHeight: 1.5,
                          color: "var(--text-secondary)",
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
                            border: currentVote === -1 ? "1px solid var(--negative-border)" : "1px solid var(--border-strong)",
                            background: currentVote === -1 ? "var(--negative-bg)" : "var(--surface-soft)",
                            color: currentVote === -1 ? "var(--negative-text)" : "var(--button-text)",
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
                            border: currentVote === 1 ? "1px solid var(--positive-border)" : "1px solid var(--border-strong)",
                            background: currentVote === 1 ? "var(--positive-bg)" : "var(--surface-soft)",
                            color: currentVote === 1 ? "var(--positive-text)" : "var(--button-text)",
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
                        color: "var(--text-muted)",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    <span>
                      {featuredParam === "true" ? "Featured" : orderParam === "likes_desc" ? "Most liked" : "Newest"}
                    </span>
                    {orderParam === "likes_desc" ? <span>Likes: {row.like_count ?? 0}</span> : null}
                    <span>{data.length > 0 ? `${currentIndex + 1} of ${data.length} on this page` : "No captions"}</span>
                  </div>
                </li>
              </ul>
            </section>
          );
        })()
      )}

      {view === "detail" ? (
        <div style={{ display: "flex", width: "100%", maxWidth: 920 }}>
          {hasPrevCaption ? (
            <a
              className="protected-hover-button"
              style={navButtonStyle}
              href={buildProtectedHref({
                view: "detail",
                page,
                index: clampedIndex - 1,
                voteState,
                order: orderParam,
                featured: featuredParam,
                publicOnly: publicOnlyParam,
              })}
            >
              ← Previous
            </a>
          ) : showPrevPageButton ? (
            <a
              className="protected-hover-button"
              style={navButtonStyle}
              href={buildProtectedHref({
                view: "detail",
                page: page - 1,
                index: 0,
                voteState,
                order: orderParam,
                featured: featuredParam,
                publicOnly: publicOnlyParam,
              })}
            >
              ← Previous
            </a>
          ) : null}
          {hasNextCaption ? (
            <a
              className="protected-hover-button"
              style={{ ...navButtonStyle, marginLeft: "auto" }}
              href={buildProtectedHref({
                view: "detail",
                page,
                index: clampedIndex + 1,
                voteState,
                order: orderParam,
                featured: featuredParam,
                publicOnly: publicOnlyParam,
              })}
            >
              Next →
            </a>
          ) : showNextPageButton ? (
            <a
              className="protected-hover-button"
              style={{ ...navButtonStyle, marginLeft: "auto" }}
              href={buildProtectedHref({
                view: "detail",
                page: page + 1,
                index: 0,
                voteState,
                order: orderParam,
                featured: featuredParam,
                publicOnly: publicOnlyParam,
              })}
            >
              Next →
            </a>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
