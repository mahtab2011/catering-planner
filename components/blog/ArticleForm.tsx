"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ArticleDoc, ArticleStatus } from "@/lib/types";
import { BLOG_CATEGORIES } from "@/lib/blogCategories";
import { getAllCuisines } from "@/lib/cuisines";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

type ArticleFormProps = {
  mode: "create" | "edit";
  articleId?: string;
  initial?: Partial<ArticleDoc>;
};

export default function ArticleForm({ mode, articleId, initial }: ArticleFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(initial?.title || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [slugEdited, setSlugEdited] = useState(mode === "edit");
  const [excerpt, setExcerpt] = useState(initial?.excerpt || "");
  const [body, setBody] = useState(initial?.body || "");
  const [authorName, setAuthorName] = useState(initial?.authorName || "London Food Hubs Team");
  const [heroImage, setHeroImage] = useState(initial?.heroImage || "");
  const [category, setCategory] = useState(initial?.category || BLOG_CATEGORIES[0]);
  const [tags, setTags] = useState((initial?.tags || []).join(", "));
  const [relatedCuisineSlugs, setRelatedCuisineSlugs] = useState<string[]>(
    initial?.relatedCuisineSlugs || []
  );
  const [status, setStatus] = useState<ArticleStatus>(initial?.status || "draft");
  const [isFeatured, setIsFeatured] = useState(Boolean(initial?.isFeatured));
  const [seoTitle, setSeoTitle] = useState(initial?.seoTitle || "");
  const [seoDescription, setSeoDescription] = useState(initial?.seoDescription || "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const cuisineOptions = getAllCuisines();

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugEdited) {
      setSlug(slugify(value));
    }
  }

  function toggleCuisine(cuisineSlug: string) {
    setRelatedCuisineSlugs((prev) =>
      prev.includes(cuisineSlug) ? prev.filter((s) => s !== cuisineSlug) : [...prev, cuisineSlug]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const finalSlug = slugify(slug || title);

    if (!title.trim() || !finalSlug || !body.trim()) {
      setError("Title, slug and body are required.");
      return;
    }

    setSaving(true);

    const data = {
      title: title.trim(),
      slug: finalSlug,
      excerpt: excerpt.trim(),
      body,
      authorName: authorName.trim() || "London Food Hubs Team",
      heroImage: heroImage.trim() || undefined,
      category,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      relatedCuisineSlugs,
      status,
      isFeatured,
      seoTitle: seoTitle.trim() || title.trim(),
      seoDescription: seoDescription.trim() || excerpt.trim(),
      updatedAt: serverTimestamp(),
      ...(status === "published" ? { publishedAt: serverTimestamp() } : {}),
    };

    try {
      if (mode === "create") {
        await addDoc(collection(db, "articles"), {
          ...data,
          createdAt: serverTimestamp(),
        });
      } else if (articleId) {
        await updateDoc(doc(db, "articles", articleId), data);
      }
      router.push("/admin/blog");
    } catch (err) {
      console.error("Failed to save article:", err);
      setError("Something went wrong saving this article. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="mb-2 block text-sm font-semibold text-neutral-700">Title</label>
        <input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-amber-500"
          required
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-neutral-700">
          URL slug (/blog/...)
        </label>
        <input
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugEdited(true);
          }}
          className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-amber-500"
          required
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-neutral-700">Excerpt</label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={2}
          maxLength={300}
          className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-amber-500"
          placeholder="Shown on the blog index and article cards"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-neutral-700">
          Body (paragraphs separated by a blank line)
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={12}
          className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-amber-500 font-mono"
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-neutral-700">Author</label>
          <input
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-neutral-700">
            Hero image URL (optional)
          </label>
          <input
            value={heroImage}
            onChange={(e) => setHeroImage(e.target.value)}
            className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-amber-500"
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-neutral-700">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-amber-500"
          >
            {BLOG_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-neutral-700">
            Tags (comma separated)
          </label>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-amber-500"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-neutral-700">
          Related cuisines
        </label>
        <div className="flex flex-wrap gap-2">
          {cuisineOptions.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => toggleCuisine(c.slug)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                relatedCuisineSlugs.includes(c.slug)
                  ? "border-amber-600 bg-amber-600 text-white"
                  : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-neutral-700">SEO title</label>
          <input
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-amber-500"
            placeholder="Defaults to the article title"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-neutral-700">
            SEO description
          </label>
          <input
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-amber-500"
            placeholder="Defaults to the excerpt"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <div>
          <label className="mb-2 block text-sm font-semibold text-neutral-700">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ArticleStatus)}
            className="rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-amber-500"
          >
            <option value="draft">Draft (not visible publicly)</option>
            <option value="published">Published</option>
          </select>
        </div>

        <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
          />
          Featured on homepage
        </label>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-amber-600 px-6 py-3 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
      >
        {saving ? "Saving..." : mode === "create" ? "Create Article" : "Save Changes"}
      </button>
    </form>
  );
}
