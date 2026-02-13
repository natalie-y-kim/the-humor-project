import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthControls } from "@/app/auth-controls";
import { createClient } from "@/lib/supabase/server";

type ImageRow = {
  id?: string | number | null;
  url?: string | null;
  created_datetime_utc?: string | null;
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

function getParam(params: SearchParams | undefined, key: string): string | undefined {
  const value = params?.[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProtectedPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
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
  const orderParam = getParam(resolvedSearchParams, "order") ?? "caption_created_desc";
  const featuredParam = getParam(resolvedSearchParams, "featured") ?? "false";
  const publicOnlyParam = getParam(resolvedSearchParams, "publicOnly") ?? "true";

  const page = Math.max(1, Number(pageParam ?? "1") || 1);
  const perPage = 12;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from(tableName)
    .select(
      "id, content, image_id, is_public, is_featured, like_count, created_datetime_utc, images!inner ( id, url, created_datetime_utc )"
    );

  if (publicOnlyParam !== "false") {
    query = query.eq("is_public", true);
  }

  if (featuredParam === "true") {
    query = query.eq("is_featured", true);
  }

  switch (orderParam) {
    case "likes_desc":
      query = query.order("like_count", { ascending: false });
      break;
    case "image_created_desc":
      query = query.order("created_datetime_utc", { ascending: false, foreignTable: "images" });
      break;
    case "caption_created_desc":
    default:
      query = query.order("created_datetime_utc", { ascending: false });
      break;
  }

  const { data, error } = await query.range(from, to);

  return (
    <main
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        flexDirection: "column",
        gap: "16px",
        padding: "40px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1>Protected Captions</h1>
      <p style={{ margin: 0, color: "#475569" }}>Signed in as {user.email ?? "Google user"}</p>
      <div style={{ display: "flex", gap: 10 }}>
        <Link href="/">Home</Link>
        <AuthControls isSignedIn />
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <a
          href={`/protected?order=caption_created_desc&featured=${featuredParam}&publicOnly=${publicOnlyParam}`}
        >
          Newest Captions
        </a>
        <a href={`/protected?order=likes_desc&featured=${featuredParam}&publicOnly=${publicOnlyParam}`}>
          Most Liked
        </a>
        <a href={`/protected?order=${orderParam}&featured=true&publicOnly=${publicOnlyParam}`}>
          Featured Only
        </a>
        <a href={`/protected?order=${orderParam}&featured=false&publicOnly=${publicOnlyParam}`}>
          All Captions
        </a>
      </div>

      {error ? (
        <p>Failed to load rows: {error.message}</p>
      ) : !data || data.length === 0 ? (
        <p>No rows found in "{tableName}".</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, width: "100%", maxWidth: 720 }}>
          {data.map((row: CaptionRow, index: number) => {
            const image = Array.isArray(row.images) ? row.images[0] : row.images;
            return (
              <li
                key={row.id ?? index}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: "12px 16px",
                  marginBottom: 12,
                  background: "#fff",
                }}
              >
                {image?.url ? (
                  <img
                    src={image.url}
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
                <p style={{ margin: "12px 0 0", fontSize: 16 }}>{row.content ?? "(no caption)"}</p>
              </li>
            );
          })}
        </ul>
      )}

      <div style={{ display: "flex", gap: 12 }}>
        {page > 1 ? (
          <a
            href={`/protected?page=${page - 1}&order=${orderParam}&featured=${featuredParam}&publicOnly=${publicOnlyParam}`}
          >
            Previous
          </a>
        ) : null}
        {data && data.length === perPage ? (
          <a
            href={`/protected?page=${page + 1}&order=${orderParam}&featured=${featuredParam}&publicOnly=${publicOnlyParam}`}
          >
            Next
          </a>
        ) : null}
      </div>
    </main>
  );
}
