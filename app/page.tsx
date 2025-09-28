"use client";

import { useState } from "react";

type Res = { ok: true; data: any } | { ok: false; error: string };

export default function Home() {
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<Res | null>(null);

  const analyze = async () => {
    setLoading(true);
    setRes(null);
    try {
      const r = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jd }),
      });
      const json = await r.json();
      if (!r.ok) setRes({ ok: false, error: json.error || "Failed" });
      else setRes({ ok: true, data: json });
    } catch (e: any) {
      setRes({ ok: false, error: e?.message || "Network error" });
    } finally {
      setLoading(false);
    }
  };

  const copyJson = () => {
    if (res && res.ok) {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        navigator.clipboard
          .writeText(JSON.stringify(res.data, null, 2))
          .then(() => console.log("Copied!"))
          .catch((err) => console.error("Copy failed:", err));
      } else {
        console.warn("Clipboard API not available");
      }
    }
  };

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">AI JD --- Skill Matrix</h1>

      <textarea
        className="w-full h-36 p-3 border rounded-md focus:outline-none focus:ring"
        placeholder="write or paste job description here…"
        value={jd}
        onChange={(e) => setJd(e.target.value)}
      />

      <div className="flex gap-3">
        <button
          onClick={analyze}
          disabled={loading || jd.trim().length < 5}
          className="px-4 py-2 rounded-md bg-black text-white disabled:opacity-50"
        >
          {loading ? "Analyzing…" : "Analyze"}
        </button>

        <button
          onClick={copyJson}
          disabled={!(res && res.ok)}
          className="px-4 py-2 rounded-md border disabled:opacity-50"
        >
          Copy JSON
        </button>
      </div>

      {res?.ok && (
        <section className="space-y-3">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Summary:</span> {res.data.summary}
          </p>
          <pre className="text-sm bg-gray-50 border rounded p-3 overflow-auto max-h-96">
            {JSON.stringify(res.data, null, 2)}
          </pre>
        </section>
      )}

      {res && !res.ok && (
        <p className="text-sm text-red-600 border border-red-200 bg-red-50 rounded p-3">
          {res.error}
        </p>
      )}
    </main>
  );
}
