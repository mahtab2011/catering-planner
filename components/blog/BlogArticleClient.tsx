"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ArticleDoc } from "@/lib/types";
import { getCuisineBySlug } from "@/lib/cuisines";
import SiteHeader from "@/components/discovery/SiteHeader";
import SiteFooter from "@/components/discovery/SiteFooter";

export default function BlogArticleClient({ slug }: { slug: string }) {
  const [article, setArticle] = useState<ArticleDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const q = query(
          collection(db, "articles"),
          where("slug", "==", slug),
          where("status", "==", "published")
        );
        const snap = await getDocs(q);
        if (!cancelled) {
          if (snap.empty) {
            setNotFound(true);
          } else {
            const d = snap.docs[0];
            setArticle({ id: d.id, ...(d.data() as Omit<ArticleDoc, "id">) });
          }
        }
      } catch (error) {
        console.error("Failed to load article:", error);
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <>
        <SiteHeader />
        <main className="min-h-screen bg-neutral-50 px-4 py-8">
          <div className="mx-auto max-w-3xl text-sm text-neutral-500">Loading article...</div>
        </main>
        <SiteFooter />
      </>
    );
  }

  if (notFound || !article) {
    return (
      <>
        <SiteHeader />
        <main className="min-h-screen bg-neutral-50 px-4 py-8">
          <div className="mx-auto max-w-3xl rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-bold text-neutral-900">Article not found</h1>
            <p className="mt-3 text-neutral-600">
              This article may have been unpublished or the link is incorrect.
            </p>
            <Link href="/blog" className="mt-6 inline-flex rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white">
              ← Back to Blog
            </Link>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  const relatedCuisines = (article.relatedCuisineSlugs || [])
    .map((s) => getCuisineBySlug(s))
    .filter(Boolean);

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-neutral-50 px-4 py-8 md:px-6">
      <div className="mx-auto max-w-3xl">
        <Link href="/blog" className="text-sm text-amber-700 hover:underline">
          ← Back to Blog
        </Link>

        <div className="mt-4 rounded-3xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
          {article.heroImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={article.heroImage} alt={article.title} className="h-64 w-full object-cover md:h-80" />
          ) : null}

          <div className="p-8">
            <div className="inline-flex rounded-full bg-amber-100 px-4 py-1 text-sm font-semibold text-amber-900">
              {article.category}
            </div>

            <h1 className="mt-4 text-3xl font-bold text-neutral-900 md:text-4xl">{article.title}</h1>

            <div className="mt-3 text-sm text-neutral-500">By {article.authorName}</div>

            <div className="mt-6 space-y-4 text-base leading-7 text-neutral-700">
              {article.body.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>

            {(article.tags || []).length > 0 ? (
              <div className="mt-8 flex flex-wrap gap-2">
                {article.tags!.map((tag) => (
                  <span key={tag} className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}

            {relatedCuisines.length > 0 ? (
              <div className="mt-6">
                <div className="text-sm font-semibold text-neutral-700">Related cuisines</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {relatedCuisines.map((c) => (
                    <Link
                      key={c!.slug}
                      href={`/cuisine/${c!.slug}`}
                      className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100"
                    >
                      {c!.name} →
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      </main>
      <SiteFooter />
    </>
  );
}
