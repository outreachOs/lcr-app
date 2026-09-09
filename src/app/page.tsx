import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-navy flex items-center justify-center">
        <span className="text-yellow font-display font-bold text-xl">L</span>
      </div>
      <h1 className="font-display text-2xl font-bold">Leicester Car Recovery</h1>
      <p className="text-ink-2 max-w-sm">
        Book a recovery and track your driver live, or register as a recovery
        partner to start receiving jobs.
      </p>
      <div className="flex gap-3">
        <Link
          href="/request"
          className="px-6 py-3 rounded-2xl bg-yellow text-navy font-display font-bold text-sm"
        >
          Request Recovery
        </Link>
        <Link
          href="/driver/apply"
          className="px-6 py-3 rounded-2xl border border-border bg-white font-display font-bold text-sm text-ink"
        >
          Drive With Us
        </Link>
      </div>
    </main>
  );
}
