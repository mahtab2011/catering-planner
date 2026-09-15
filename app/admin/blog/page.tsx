"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAdminGate } from "@/hooks/useAdminGate";
import type { ArticleDoc } from "@/lib/types";

function tsToMs(value: unknown) {
  const v = value as { seconds?: number } | undefined;
  if (v?.seconds != null) return v.seconds * 1000;
  return 0;
}

export default function AdminBlogListPage() {
  const { checking, allowed } = useAdminGate();
  const [articles, setArticles] = useState<ArticleDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!allowed) return;

    let cancelled = false;

    async function load() {
      try {
        const snap = await getDocs(query(collection(db, "articles")));
        if (!cancelled) {
          const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ArticleDoc, "id">) }));
          rows.sort((a, b) => tsToMs(b.createdAt) - tsToMs(a.createdAt));
          setArticles(rows);
        }
      } catch (error) {
        console.error("Failed to load articles:", error);
        if (!cancelled) setArticles([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [allowed]);

  if (checking) {
    return <div className="mx-auto max-w-5xl p-6 text-sm text-neutral-500">Checking access...</div>;
  }

  if (!allowed) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          This page is restricted to admin accounts.{" "}
          <Link href="/login" className="font-semibold underline">
            Sign in
          </Link>{" "}
          with an admin account to continue.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Blog Articles</h1>
          <p className="text-sm text-neutral-600">Publish and manage London Food Hubs editorial content.</p>
        </div>
        <Link
          href="/admin/blog/new"
          className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
        >
          + New Article
        </Link>
      </div>

      {loading ? (
        <div className="text-sm text-neutral-500">Loading articles...</div>
      ) : articles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 p-6 text-sm text-neutral-500">
          No articles yet.{" "}
          <Link href="/admin/blog/new" className="font-semibold text-amber-700 underline">
            Write the first one
          </Link>
          .
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/admin/blog/${article.id}/edit`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white p-4 hover:shadow-sm"
            >
              <div>
                <div className="font-semibold text-neutral-900">{article.title}</div>
                <div className="mt-1 text-xs text-neutral-500">
                  {article.category} · /blog/{article.slug}
                </div>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  article.status === "published"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-neutral-200 text-neutral-700"
                }`}
              >
                {article.status === "published" ? "Published" : "Draft"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
