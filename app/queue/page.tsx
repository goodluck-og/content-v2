"use client";

import { useEffect, useRef, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ToastStack, Toast } from "@/components/ToastStack";
import { CheckSquare, Square, ShieldAlert, Upload, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Post = {
  _id: string;
  driveFileName?: string;
  caption?: string;
  hashtags?: string[];
  detectedCharacter?: string;
  detectedSource?: string;
  status: string;
  coverFrameUrl?: string;
  repostRiskLevel?: "none" | "warning" | "high";
  repostRiskReasons?: string[];
  partNumber?: number;
  seriesLabel?: string;
};

export default function QueuePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [failedPosts, setFailedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [generating, setGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function pushToast(message: string) {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2500);
  }

  function loadPosts() {
    setLoading(true);
    fetch("/api/videos?status=pending_review")
      .then((r) => r.json())
      .then((d) => setPosts(d.posts || []))
      .finally(() => setLoading(false));

    fetch("/api/videos?status=failed")
      .then((r) => r.json())
      .then((d) => setFailedPosts(d.posts || []));
  }

  useEffect(() => {
    loadPosts();
  }, []);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function approve(postId: string) {
    const res = await fetch("/api/post/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
    });
    if (res.ok) {
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      pushToast("Approved and scheduled");
    } else {
      const err = await res.json();
      pushToast(`Couldn't schedule: ${err.error || "unknown error"}`);
    }
  }

  async function bulkApprove() {
    if (selected.size === 0) return;
    const count = selected.size;
    await fetch("/api/post/bulk-approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postIds: Array.from(selected) }),
    });
    setPosts((prev) => prev.filter((p) => !selected.has(p._id)));
    setSelected(new Set());
    pushToast(`${count} clips scheduled`);
  }

  async function markDraft(postId: string) {
    await fetch("/api/post/toggle-draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, doNotPost: true }),
    });
    setPosts((prev) => prev.filter((p) => p._id !== postId));
    pushToast("Saved as draft");
  }

  async function retryPost(postId: string) {
    pushToast("Retrying…");
    const res = await fetch("/api/post/retry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
    });
    if (res.ok) {
      setFailedPosts((prev) => prev.filter((p) => p._id !== postId));
      pushToast("Published successfully");
    } else {
      const err = await res.json();
      pushToast(`Still failing: ${err.error?.slice(0, 60) || "unknown error"}`);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setGenerating(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch("/api/caption/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frameBase64: base64, driveFileName: file.name }),
      });
      if (res.ok) {
        pushToast("AI caption generated");
        loadPosts();
      } else {
        const err = await res.json();
        pushToast(`Generation failed: ${err.error || "unknown error"}`);
      }
    } finally {
      setGenerating(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="flex min-h-screen bg-ink">
      <Sidebar />
      <ToastStack toasts={toasts} />

      <main className="flex-1 px-8 py-8 max-w-4xl">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-white text-2xl font-bold">Review Queue</h1>
            <p className="text-cream/60 text-sm mt-1">
              Clips detected from Drive, plus anything you test manually below.
            </p>
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={generating}
              className="flex items-center gap-2 bg-lime text-white text-sm font-medium px-4 py-2.5 rounded-lg disabled:opacity-50"
            >
              {generating ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {generating ? "Analyzing…" : "Test with a frame"}
            </button>
          </div>
        </div>

        <div className="glass rounded-2xl p-3 mb-5 text-xs text-cream/50">
          Testing tip: since Drive automation needs a connected folder, upload any
          still image here (a screenshot of a video frame works) to confirm the
          Gemini caption pipeline actually works end to end before relying on the
          full Drive → YouTube flow.
        </div>

        {selected.size > 0 && (
          <div className="flex justify-end mb-3">
            <button
              onClick={bulkApprove}
              className="text-xs bg-lime text-white font-medium px-3 py-1.5 rounded-md"
            >
              Approve {selected.size} selected
            </button>
          </div>
        )}

        {loading && <p className="text-cream/40 text-sm">Loading…</p>}
        {!loading && posts.length === 0 && (
          <div className="glass rounded-2xl p-8 text-center text-cream/40 text-sm">
            Nothing waiting on you right now.
          </div>
        )}

        <div className="space-y-3">
          <AnimatePresence>
            {posts.map((p) => (
              <motion.div
                key={p._id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 40 }}
                className="glass rounded-2xl p-4 flex flex-col gap-3"
              >
                {p.repostRiskLevel && p.repostRiskLevel !== "none" && (
                  <div className="flex items-start gap-2 text-xs rounded-md px-2.5 py-2 bg-ember/10 border border-ember/30 text-ember">
                    <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Heads up</p>
                      {p.repostRiskReasons?.map((r, i) => (
                        <p key={i} className="text-cream/50 mt-0.5">{r}</p>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <button onClick={() => toggleSelect(p._id)} className="mt-1 text-lime shrink-0">
                    {selected.has(p._id) ? <CheckSquare size={18} /> : <Square size={18} className="text-cream/30" />}
                  </button>

                  {p.coverFrameUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.coverFrameUrl}
                      alt=""
                      className="w-16 h-20 object-cover rounded-md border border-cream/10 shrink-0 bg-ink"
                    />
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-cream truncate">
                      {p.partNumber ? `${p.seriesLabel} ${p.partNumber}: ` : ""}
                      {p.driveFileName || "Untitled clip"}
                    </p>
                    {p.detectedCharacter && (
                      <p className="text-xs text-cream/40 mt-0.5">
                        {p.detectedCharacter} — {p.detectedSource}
                      </p>
                    )}
                    <p className="text-sm text-cream/80 mt-2">{p.caption}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {p.hashtags?.map((h) => (
                        <span key={h} className="text-xs bg-ink/60 border border-cream/10 text-cream/50 px-2 py-0.5 rounded">
                          #{h.replace(/^#/, "")}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pl-8">
                  <button
                    onClick={() => approve(p._id)}
                    className="flex-1 bg-lime text-white text-sm font-semibold px-4 py-2.5 rounded-lg"
                  >
                    Approve &amp; Schedule
                  </button>
                  <button
                    onClick={() => markDraft(p._id)}
                    className="text-sm text-cream/40 px-3 py-2.5 rounded-lg border border-cream/10"
                  >
                    Draft
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {failedPosts.length > 0 && (
          <div className="mt-8">
            <p className="text-sm font-medium text-ember mb-3">Failed to publish</p>
            <div className="space-y-2">
              {failedPosts.map((p) => (
                <div key={p._id} className="glass rounded-xl p-3 flex items-center justify-between gap-3 border border-ember/20">
                  <div className="min-w-0">
                    <p className="text-sm text-cream truncate">{p.driveFileName || p.caption}</p>
                  </div>
                  <button
                    onClick={() => retryPost(p._id)}
                    className="shrink-0 text-xs bg-ember text-white px-3 py-1.5 rounded-md"
                  >
                    Retry
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
