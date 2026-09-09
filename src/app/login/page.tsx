"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

// useSearchParams() requires a Suspense boundary in the App Router, or the
// build fails on this page — see https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", { phone, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Phone or password didn't match.");
      return;
    }
    router.push(params.get("callbackUrl") ?? "/");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white rounded-card border border-border p-6 shadow-sm">
        <h1 className="font-display font-bold text-xl mb-1">Sign in</h1>
        <p className="text-ink-2 text-sm mb-5">Customers, drivers and admin all sign in here.</p>

        <label className="block text-xs font-bold text-ink-3 mb-1">PHONE NUMBER</label>
        <input
          className="w-full bg-bg rounded-xl px-3 py-3 mb-4 text-sm"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="07XXX XXXXXX"
          required
        />

        <label className="block text-xs font-bold text-ink-3 mb-1">PASSWORD</label>
        <input
          type="password"
          className="w-full bg-bg rounded-xl px-3 py-3 mb-4 text-sm"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="text-red-600 text-xs mb-3">{error}</p>}

        <button
          disabled={loading}
          className="w-full bg-yellow text-navy font-display font-bold text-sm rounded-xl py-3 disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
