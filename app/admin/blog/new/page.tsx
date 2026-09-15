"use client";

import Link from "next/link";
import { useAdminGate } from "@/hooks/useAdminGate";
import ArticleForm from "@/components/blog/ArticleForm";

export default function NewArticlePage() {
  const { checking, allowed } = useAdminGate();

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

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-2xl font-bold text-neutral-900">New Article</h1>
      <ArticleForm mode="create" />
    </div>
  );
}
