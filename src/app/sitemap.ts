import type { MetadataRoute } from "next";
import { getPostsByLocale } from "@/lib/posts";

const BASE_URL = "https://roarion.me";
const locales = ["ko", "en", "ja"];

const STATIC_PAGES = [
  { path: "", priority: 1.0, changeFrequency: "weekly" as const },
  { path: "/about", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/articles", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/career", priority: 0.7, changeFrequency: "monthly" as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries = locales.flatMap((locale) =>
    STATIC_PAGES.map(({ path, priority, changeFrequency }) => ({
      url: `${BASE_URL}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency,
      priority,
    }))
  );

  const seenUrls = new Set<string>();
  const postEntries = locales.flatMap((locale) =>
    getPostsByLocale(locale)
      .map((post) => {
        const url = `${BASE_URL}/${locale}/articles/${encodeURIComponent(post.slug)}`;
        if (seenUrls.has(url)) return null;
        seenUrls.add(url);
        return {
          url,
          lastModified: new Date(post.date),
          changeFrequency: "never" as const,
          priority: 0.6,
        };
      })
      .filter((e): e is NonNullable<typeof e> => e !== null)
  );

  return [...staticEntries, ...postEntries];
}
