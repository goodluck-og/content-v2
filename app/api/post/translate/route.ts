import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/db";
import { getCurrentAccount } from "@/lib/sessionAccount";
import Post from "@/models/Post";
import { translateCaption } from "@/lib/gemini";

const LANGUAGE_NAMES: Record<string, string> = {
  es: "Spanish", pt: "Portuguese", id: "Indonesian", fr: "French",
  de: "German", ja: "Japanese", ko: "Korean",
};

export async function POST(req: NextRequest) {
  await connectDB();
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { postId, languageCode } = await req.json();
  const languageName = LANGUAGE_NAMES[languageCode];
  if (!languageName) return NextResponse.json({ error: "Unsupported language code" }, { status: 400 });

  const post = await Post.findOne({ _id: postId, accountId: account._id });
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const translated = await translateCaption(post.caption || "", languageName);
  post.translations = { ...(post.translations || {}), [languageCode]: translated };
  await post.save();

  return NextResponse.json({ translations: post.translations });
}
