import { google } from "googleapis";
import { getAuthenticatedClient } from "@/lib/googleAuth";
import fs from "fs";

/**
 * Uploads a video to YouTube as a Short (vertical, <60s, with #Shorts in
 * title/description so YouTube's system recognizes it as one).
 *
 * videoFilePath: local file path on disk (the video needs to be downloaded
 * from Drive to a temp file first - see notes in the Drive fetch step).
 */
export async function uploadToYouTube({
  googleTokens,
  videoFilePath,
  title,
  description,
  tags,
  privacyStatus = "public",
}: {
  googleTokens: Record<string, unknown>;
  videoFilePath: string;
  title: string;
  description: string;
  tags: string[];
  privacyStatus?: "public" | "unlisted" | "private";
}) {
  const authClient = getAuthenticatedClient(googleTokens);
  const youtube = google.youtube({ version: "v3", auth: authClient });

  // Shorts require #Shorts in the title or description to be treated as one
  const shortsDescription = description.includes("#Shorts")
    ? description
    : `${description}\n\n#Shorts`;

  const res = await youtube.videos.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: {
        title,
        description: shortsDescription,
        tags,
        categoryId: "24", // Entertainment
      },
      status: {
        privacyStatus,
        selfDeclaredMadeForKids: false,
      },
    },
    media: {
      body: fs.createReadStream(videoFilePath),
    },
  });

  return {
    videoId: res.data.id,
    url: `https://youtube.com/shorts/${res.data.id}`,
  };
}

export async function getYouTubeVideoStats({ googleTokens, videoIds }: { googleTokens: Record<string, unknown>; videoIds: string[] }) {
  if (!videoIds.length) return [];
  const authClient = getAuthenticatedClient(googleTokens);
  const youtube = google.youtube({ version: "v3", auth: authClient });
  const res = await youtube.videos.list({ part: ["statistics", "snippet"], id: videoIds });
  return (res.data.items || []).map(item => ({
    id: item.id || "",
    publishedAt: item.snippet?.publishedAt ? new Date(item.snippet.publishedAt) : null,
    views: Number(item.statistics?.viewCount || 0),
    likes: Number(item.statistics?.likeCount || 0),
    comments: Number(item.statistics?.commentCount || 0),
  }));
}
