"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ArticleDoc } from "@/lib/types";

function tsToMs(value: unknown) {
  const v = value as { seconds?: number } | undefined;
  if (v?.seconds != null) return v.seconds * 1000;
  return 0;
}

export default function BlogPreviewSection() {
  const [articles, setArticles] = useState<ArticleDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const q = query(collection(db, "articles"), where("status", "==", "published"));
        const snap = await getDocs(q);
        if (!cancelled) {
          const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ArticleDoc, "id">) }));
          rows.sort((a, b) => tsToMs(b.publishedAt) - tsToMs(a.publishedAt));
          setArticles(rows.slice(0, 3));
        }
      } catch (error) {
        console.error("Failed to load blog preview:", error);
        if (!cancelled) setArticles([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return null;

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-neutral-900">From the London Food Hubs Blog</h2>
        <Link href="/blog" className="text-sm font-semibold text-amber-700 hover:underline">
          Visit the Blog →
        </Link>
      </div>

      {articles.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 bg-white p-6 text-sm text-neutral-500">
          Our editorial team is preparing the first stories — check back soon.
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/blog/${article.slug}`}
              className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              {article.heroImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={article.heroImage} alt={article.title} className="h-36 w-full object-cover" />
              ) : (
                <div className="h-36 w-full bg-linear-to-br from-amber-100 via-orange-50 to-rose-100" />
              )}
              <div className="p-5">
                <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                  {article.category}
                </div>
                <div className="mt-2 text-base font-bold text-neutral-900">{article.title}</div>
                <p className="mt-2 line-clamp-2 text-sm text-neutral-600">{article.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
