"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ArticleDoc } from "@/lib/types";
import { BLOG_CATEGORIES } from "@/lib/blogCategories";
import { getLocalizedArticleContent } from "@/lib/articles";
import SiteHeader from "@/components/discovery/SiteHeader";
import SiteFooter from "@/components/discovery/SiteFooter";

function tsToMs(value: unknown) {
  const v = value as { seconds?: number } | undefined;
  if (v?.seconds != null) return v.seconds * 1000;
  return 0;
}

export default function BlogIndexClient() {
  const t = useTranslations("Blog");
  const locale = useLocale();
  const [articles, setArticles] = useState<ArticleDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("All");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const q = query(collection(db, "articles"), where("status", "==", "published"));
        const snap = await getDocs(q);
        if (!cancelled) {
          const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ArticleDoc, "id">) }));
          rows.sort((a, b) => tsToMs(b.publishedAt) - tsToMs(a.publishedAt));
          setArticles(rows);
        }
      } catch (error) {
        console.error("Failed to load blog articles:", error);
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

  const categoriesPresent = useMemo(() => {
    const present = new Set(articles.map((a) => a.category));
    return BLOG_CATEGORIES.filter((c) => present.has(c));
  }, [articles]);

  const filtered = useMemo(() => {
    if (activeCategory === "All") return articles;
    return articles.filter((a) => a.category === activeCategory);
  }, [articles, activeCategory]);

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
          <div className="inline-flex rounded-full bg-amber-100 px-4 py-1 text-sm font-semibold text-amber-900">
            {t("title")}
          </div>
          <h1 className="mt-4 text-3xl font-bold text-neutral-900 md:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-neutral-600">
            {t("subtitle")}
          </p>
        </div>

        {categoriesPresent.length > 0 ? (
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveCategory("All")}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                activeCategory === "All"
                  ? "border-amber-600 bg-amber-600 text-white"
                  : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
              }`}
            >
              {t("all")}
            </button>
            {categoriesPresent.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setActiveCategory(c)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  activeCategory === c
                    ? "border-amber-600 bg-amber-600 text-white"
                    : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        ) : null}

        <div className="mt-8">
          {loading ? (
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">
              {t("loadingArticles")}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">
              {t("noArticlesYet")}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((article) => {
                const content = getLocalizedArticleContent(article, locale);
                return (
                  <Link
                    key={article.id}
                    href={`/blog/${article.slug}`}
                    className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                  >
                    {article.heroImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={article.heroImage}
                        alt={content.title}
                        className="h-44 w-full object-cover"
                      />
                    ) : (
                      <div className="h-44 w-full bg-linear-to-br from-amber-100 via-orange-50 to-rose-100" />
                    )}
                    <div className="p-5">
                      <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                        {article.category}
                      </div>
                      <div className="mt-2 text-lg font-bold text-neutral-900">{content.title}</div>
                      <p className="mt-2 line-clamp-2 text-sm text-neutral-600">{content.excerpt}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
      </main>
      <SiteFooter />
    </>
  );
}
