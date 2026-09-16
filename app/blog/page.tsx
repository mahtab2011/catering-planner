import { redirect } from "next/navigation";

/** Legacy URL compatibility — the real implementation now lives at
 *  app/[locale]/blog/page.tsx. See docs/MULTILINGUAL-ARCHITECTURE.md. */
export default function LegacyBlogIndexRedirect() {
  redirect("/en/blog");
}
