"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAdminGate } from "@/hooks/useAdminGate";
import ArticleForm from "@/components/blog/ArticleForm";
import type { ArticleDoc } from "@/lib/types";

export default function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { checking, allowed } = useAdminGate();
  const [article, setArticle] = useState<ArticleDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!allowed) return;

    let cancelled = false;

    async function load() {
      try {
        const snap = await getDoc(doc(db, "articles", id));
        if (!cancelled && snap.exists()) {
          setArticle({ id: snap.id, ...(snap.data() as Omit<ArticleDoc, "id">) });
        }
      } catch (error) {
        console.error("Failed to load article:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [allowed, id]);

  if (checking) {
    return <div className="mx-auto max-w-3xl p-6 text-sm text-neutral-500">Checking access...</div>;
  }

  if (!allowed) {
    return (
      <div className="mx-auto max-w-3xl p-6">
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

  if (loading) {
    return <div className="mx-auto max-w-3xl p-6 text-sm text-neutral-500">Loading article...</div>;
  }

  if (!article) {
    return <div className="mx-auto max-w-3xl p-6 text-sm text-neutral-500">Article not found.</div>;
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-2xl font-bold text-neutral-900">Edit Article</h1>
      <ArticleForm mode="edit" articleId={article.id} initial={article} />
    </div>
  );
}
