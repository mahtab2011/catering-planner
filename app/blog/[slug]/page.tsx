import type { Metadata } from "next";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ArticleDoc } from "@/lib/types";
import BlogArticleClient from "@/components/blog/BlogArticleClient";

type Params = { params: Promise<{ slug: string }> };

async function fetchPublishedArticle(slug: string): Promise<ArticleDoc | null> {
  try {
    const q = query(
      collection(db, "articles"),
      where("slug", "==", slug),
      where("status", "==", "published")
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...(d.data() as Omit<ArticleDoc, "id">) };
  } catch (error) {
    console.error("Failed to fetch article for metadata:", error);
    return null;
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchPublishedArticle(slug);

  if (!article) {
    return { title: "Article not found | London Food Hubs" };
  }

  return {
    title: article.seoTitle || article.title,
    description: article.seoDescription || article.excerpt,
    alternates: { canonical: `/blog/${article.slug}` },
    openGraph: {
      title: article.seoTitle || article.title,
      description: article.seoDescription || article.excerpt,
      url: `https://londonfoodhubs.com/blog/${article.slug}`,
      siteName: "London Food Hubs",
      type: "article",
    },
  };
}

export default async function BlogArticlePage({ params }: Params) {
  const { slug } = await params;
  return <BlogArticleClient slug={slug} />;
}
