"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function voteOnCaption(formData: FormData) {
  const captionId = formData.get("caption_id");
  const voteValueRaw = formData.get("vote_value");
  const voteValue = Number(voteValueRaw);

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
}
