"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function voteOnCaption(formData: FormData) {
  const captionId = formData.get("caption_id");
  const voteValueRaw = formData.get("vote_value");
  const currentPageRaw = formData.get("current_page");
  const currentIndexRaw = formData.get("current_index");
  const orderParam = formData.get("order");
  const featuredParam = formData.get("featured");
  const publicOnlyParam = formData.get("publicOnly");
  const voteValue = Number(voteValueRaw);
  const currentPage = Math.max(1, Number(currentPageRaw) || 1);
  const currentIndex = Math.max(0, Number(currentIndexRaw) || 0);

  if (typeof captionId !== "string" || !captionId || (voteValue !== 1 && voteValue !== -1)) {
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const { data: existingVote, error: existingVoteError } = await supabase
    .from("caption_votes")
    .select("id")
    .eq("profile_id", user.id)
    .eq("caption_id", captionId)
    .maybeSingle();

  if (existingVoteError) {
    return;
  }

  if (existingVote?.id) {
    await supabase
      .from("caption_votes")
      .update({
        vote_value: voteValue,
        modified_datetime_utc: new Date().toISOString(),
      })
      .eq("id", existingVote.id);
  } else {
    await supabase.from("caption_votes").insert({
      profile_id: user.id,
      caption_id: captionId,
      vote_value: voteValue,
      created_datetime_utc: new Date().toISOString(),
    });
  }

  revalidatePath("/protected");

  const params = new URLSearchParams({
    page: String(currentPage),
    index: String(currentIndex),
    order: typeof orderParam === "string" && orderParam ? orderParam : "caption_created_desc",
    featured: typeof featuredParam === "string" && featuredParam ? featuredParam : "false",
    publicOnly: typeof publicOnlyParam === "string" && publicOnlyParam ? publicOnlyParam : "true",
  });

  redirect(`/protected?${params.toString()}`);
}
