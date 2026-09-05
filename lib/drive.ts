import { google } from "googleapis";
import { getAuthenticatedClient } from "@/lib/googleAuth";
import fs from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";

export function getDrive(googleTokens: Record<string, unknown>) {
  return google.drive({ version: "v3", auth: getAuthenticatedClient(googleTokens) });
}

export async function listNewDriveVideos(googleTokens: Record<string, unknown>, folderId: string) {
  const drive = getDrive(googleTokens);
  const res = await drive.files.list({
    q: `'${folderId}' in parents and mimeType contains 'video/' and trashed = false`,
    fields: "files(id,name,createdTime,mimeType,thumbnailLink,parents,videoMediaMetadata)",
    orderBy: "createdTime desc",
    pageSize: 100,
  });
  return res.data.files || [];
}

export async function getDriveVideo(googleTokens: Record<string, unknown>, fileId: string) {
  const drive = getDrive(googleTokens);
  const res = await drive.files.get({ fileId, fields: "id,name,mimeType,createdTime,thumbnailLink,parents,videoMediaMetadata,md5Checksum" });
  return res.data;
}

export async function fetchDriveThumbnail(googleTokens: Record<string, unknown>, thumbnailLink: string) {
  const auth = getAuthenticatedClient(googleTokens);
  const accessToken = await auth.getAccessToken();
  const response = await fetch(thumbnailLink, { headers: { Authorization: `Bearer ${accessToken.token}` }, cache: "no-store" });
  if (!response.ok) throw new Error(`Drive thumbnail fetch failed: ${response.status}`);
  const contentType = response.headers.get("content-type") || "image/jpeg";
  const buffer = Buffer.from(await response.arrayBuffer());
  return { base64: buffer.toString("base64"), contentType };
}

export async function getDriveStartPageToken(googleTokens: Record<string, unknown>) {
  const drive = getDrive(googleTokens);
  const res = await drive.changes.getStartPageToken();
  return res.data.startPageToken || "";
}

export async function createDriveChangesWatch(googleTokens: Record<string, unknown>, address: string, token: string) {
  const drive = getDrive(googleTokens);
  const channelId = crypto.randomUUID();
  const expiration = Date.now() + 6 * 24 * 60 * 60 * 1000;
  const res = await drive.changes.watch({
    pageToken: token,
    requestBody: { id: channelId, type: "web_hook", address, token, expiration: String(expiration) },
  });
  return { channelId, resourceId: res.data.resourceId || "", expiration: res.data.expiration ? new Date(Number(res.data.expiration)) : new Date(expiration) };
}

export async function listDriveChanges(googleTokens: Record<string, unknown>, pageToken: string) {
  const drive = getDrive(googleTokens);
  return drive.changes.list({ pageToken, spaces: "drive", includeRemoved: false, fields: "nextPageToken,newStartPageToken,changes(fileId,removed,file(id,name,mimeType,createdTime,thumbnailLink,parents,videoMediaMetadata,md5Checksum))", pageSize: 100 });
}

export async function downloadDriveFile(googleTokens: Record<string, unknown>, fileId: string) {
  const drive = getDrive(googleTokens);
  const destPath = path.join(os.tmpdir(), `content-autopilot-${fileId}.mp4`);
  const dest = fs.createWriteStream(destPath);
  const res = await drive.files.get({ fileId, alt: "media" }, { responseType: "stream" });
  await new Promise<void>((resolve, reject) => {
    res.data.on("end", resolve).on("error", reject).pipe(dest);
  });
  return destPath;
}
