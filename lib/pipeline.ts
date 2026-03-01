const BASE_URL = "https://api.almostcrackd.ai";

export async function generatePresignedUrl(accessToken: string, contentType: string): Promise<{
  presignedUrl: string;
  cdnUrl: string;
}> {
  const res = await fetch(`${BASE_URL}/pipeline/generate-presigned-url`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ contentType }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Request failed (${res.status}): ${text}`);
  }

  return res.json();
}

export async function uploadToPresignedUrl(presignedUrl: string, file: File): Promise<void> {
  const res = await fetch(presignedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Request failed (${res.status}): ${text}`);
  }
}

export async function registerImageUrl(
  accessToken: string,
  imageUrl: string
): Promise<{ imageId: string; now: number }> {
  const res = await fetch(`${BASE_URL}/pipeline/upload-image-from-url`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ imageUrl, isCommonUse: false }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Request failed (${res.status}): ${text}`);
  }

  return res.json();
}

export async function generateCaptions(accessToken: string, imageId: string): Promise<any[]> {
  const res = await fetch(`${BASE_URL}/pipeline/generate-captions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ imageId }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Request failed (${res.status}): ${text}`);
  }

  return res.json();
}
