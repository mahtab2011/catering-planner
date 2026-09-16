"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ArticleDoc } from "@/lib/types";
import { getCuisineBySlug, getCuisineDisplayName } from "@/lib/cuisines";
import { getLocalizedArticleContent } from "@/lib/articles";
import SiteHeader from "@/components/discovery/SiteHeader";
import SiteFooter from "@/components/discovery/SiteFooter";

export default function BlogArticleClient({ slug }: { slug: string }) {
  const locale = useLocale();
  const t = useTranslations("Blog");
  const tCommon = useTranslations("Common");
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
          <div className="mx-auto max-w-3xl text-sm text-neutral-500">{tCommon("loading")}</div>
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
            <h1 className="text-2xl font-bold text-neutral-900">{t("articleNotFound")}</h1>
            <p className="mt-3 text-neutral-600">
              {t("articleNotFoundBody")}
            </p>
            <Link href="/blog" className="mt-6 inline-flex rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white">
              ← {t("backToBlog")}
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

  const content = getLocalizedArticleContent(article, locale);
  const showOriginalLanguageNote = locale !== "en" && !content.isFullyTranslated;

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-neutral-50 px-4 py-8 md:px-6">
      <div className="mx-auto max-w-3xl">
        <Link href="/blog" className="text-sm text-amber-700 hover:underline">
          ← {t("backToBlog")}
        </Link>

        <div className="mt-4 rounded-3xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
          {article.heroImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={article.heroImage} alt={content.title} className="h-64 w-full object-cover md:h-80" />
          ) : null}

          <div className="p-8">
            <div className="inline-flex rounded-full bg-amber-100 px-4 py-1 text-sm font-semibold text-amber-900">
              {article.category}
            </div>

            {showOriginalLanguageNote ? (
              <p className="mt-3 rounded-lg bg-neutral-100 px-3 py-2 text-xs text-neutral-600">
                {t("originalLanguageNote")}
              </p>
            ) : null}

            <h1 className="mt-4 text-3xl font-bold text-neutral-900 md:text-4xl">{content.title}</h1>

            <div className="mt-3 text-sm text-neutral-500">{t("by", { author: article.authorName })}</div>

            <div className="mt-6 space-y-4 text-base leading-7 text-neutral-700">
              {content.body.split("\n\n").map((para, i) => (
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
                <div className="text-sm font-semibold text-neutral-700">{t("relatedCuisines")}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {relatedCuisines.map((c) => (
                    <Link
                      key={c!.slug}
                      href={`/cuisine/${c!.slug}`}
                      className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100"
                    >
                      {getCuisineDisplayName(c!, locale)} →
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
