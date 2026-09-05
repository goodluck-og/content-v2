"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" role="img">
      <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.3-1.6 3.8-5.4 3.8-3.3 0-5.9-2.7-5.9-6s2.6-6 5.9-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.5 14.7 2.6 12 2.6 6.9 2.6 2.8 6.7 2.8 11.8S6.9 21 12 21c6.9 0 11.4-4.8 11.4-11.5 0-.8-.1-1.4-.2-2H12z" />
      <path fill="#34A853" d="M3.8 7.2l3.6 2.7c1-1.9 2.9-3.2 4.6-3.2 1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.5 14.7 2.6 12 2.6c-3.9 0-7.2 2.3-8.2 5.6z" />
      <path fill="#FBBC05" d="M3.8 16.8A9.2 9.2 0 0 1 3.3 12c0-1.1.2-2.2.6-3.2l3.9 3.1c-.2.6-.3 1.3-.3 2.1 0 .8.1 1.5.3 2.1l-3.8 3.1z" />
      <path fill="#4285F4" d="M12 21c2.6 0 4.8-.9 6.4-2.4l-3-2.5c-.9.6-2 1-3.4 1-2.8 0-4.2-1.7-5.1-3.2l-3.8 3c1.7 3.5 5.3 5.1 9.3 5.1z" />
    </svg>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) setError("Invalid email or password.");
    else window.location.href = "/";
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-teal/20 rounded-card p-6">
        <h1 className="text-white text-xl font-bold mb-1">Welcome back</h1>
        <p className="text-cream/60 text-sm mb-6">Log in to Content Autopilot</p>

        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="w-full bg-cream text-ink font-medium text-sm rounded-lg py-2.5 mb-3 hover:opacity-90 transition flex items-center justify-center gap-2"
        >
          <GoogleIcon />
          Continue with Google
        </button>
        <p className="text-[11px] text-cream/40 mb-4 text-center">
          Google sign-in is currently limited to approved tester emails until the app passes Google verification.
        </p>

        <div className="flex items-center gap-2 mb-4">
          <div className="h-px bg-cream/20 flex-1" />
          <span className="text-cream/40 text-xs">or</span>
          <div className="h-px bg-cream/20 flex-1" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-ink border border-cream/20 text-cream text-sm rounded-lg px-3 py-2.5 outline-none focus:border-lime"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-ink border border-cream/20 text-cream text-sm rounded-lg px-3 py-2.5 outline-none focus:border-lime"
          />
          {error && <p className="text-ember text-xs">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-lime text-white font-medium text-sm rounded-lg py-2.5 hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="text-cream/50 text-xs mt-5 text-center">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-lime">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
