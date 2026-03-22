import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeKatex from "rehype-katex";
import rehypeStringify from "rehype-stringify";

export type Post = {
  slug: string;
  locale: string;
  title: string;
  date: string;
  tags: string[];
  description: string;
  published: boolean;
  image?: string;
  font?: string;
  fontSize?: string;
  lineHeight?: string;
  paragraphSpacing?: string;
  content: string;
};

const postsDirectory = path.join(process.cwd(), "content/posts");

const LOCALE_NAMES: Record<string, string[]> = {
  ko: ["korean", "한국어", "ko"],
  en: ["english", "영어", "en"],
  ja: ["japanese", "일본어", "日本語", "ja"],
};

function languageHeaderMatchesLocale(langHeader: string, locale: string): boolean {
  const values = langHeader.split(",").map((s) => s.trim().toLowerCase());
  if (values.some((v) => v === "all" || v === "전체" || v === "*")) return true;
  return values.some((v) => LOCALE_NAMES[locale]?.includes(v));
}

function buildPost(slug: string, locale: string, data: Record<string, unknown>, content: string): Post {
  return {
    slug,
    locale,
    title: String(data.title || ""),
    date: data.date ? String(data.date) : "",
    tags: (data.tags as string[]) || [],
    description: String(data.description || ""),
    published: data.published !== false,
    image: data.image ? String(data.image) : undefined,
    font: data.font ? String(data.font) : undefined,
    fontSize: data.fontSize ? String(data.fontSize) : undefined,
    lineHeight: data.lineHeight !== undefined ? String(data.lineHeight) : undefined,
    paragraphSpacing: data.paragraphSpacing !== undefined ? String(data.paragraphSpacing) : undefined,
    content,
  };
}

export function getPostsByLocale(locale: string): Post[] {
  if (!fs.existsSync(postsDirectory)) return [];

  const files = fs.readdirSync(postsDirectory);
  const knownLocaleSuffixes = [".ko.md", ".en.md", ".ja.md"];

  const parseFile = (filename: string, slug: string, usedLocale: string): Post => {
    const fullPath = path.join(postsDirectory, filename);
    const { data, content } = matter(fs.readFileSync(fullPath, "utf8"));
    return buildPost(slug, usedLocale, data, content);
  };

  // 1. 파일명 로케일 방식: slug.ko.md / slug.en.md / slug.ja.md
  const localePosts = files
    .filter((f) => f.endsWith(`.${locale}.md`))
    .map((f) => parseFile(f, f.replace(`.${locale}.md`, ""), locale))
    .filter((p) => p.published);

  const seenSlugs = new Set(localePosts.map((p) => p.slug));

  // 2. 헤더 언어 방식: slug.md + language: Korean, English
  const headerPosts = files
    .filter((f) => f.endsWith(".md") && !knownLocaleSuffixes.some((s) => f.endsWith(s)))
    .map((f) => parseFile(f, f.replace(/\.md$/, ""), locale))
    .filter((p) => {
      if (!p.published || seenSlugs.has(p.slug)) return false;
      const fullPath = path.join(postsDirectory, `${p.slug}.md`);
      const { data } = matter(fs.readFileSync(fullPath, "utf8"));
      const lang: string = (data.language as string) || "all";
      return languageHeaderMatchesLocale(lang, locale);
    });

  headerPosts.forEach((p) => seenSlugs.add(p.slug));

  // 3. 폴백: 위 두 방식에 없는 한국어 파일을 다른 언어에서도 표시
  const fallbackPosts = locale !== "ko"
    ? files
        .filter((f) => f.endsWith(".ko.md"))
        .map((f) => parseFile(f, f.replace(".ko.md", ""), "ko"))
        .filter((p) => p.published && !seenSlugs.has(p.slug))
    : [];

  return [...localePosts, ...headerPosts, ...fallbackPosts]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPost(slug: string, locale: string): Post | null {
  // 1. 파일명 로케일 방식 우선
  const tryLocales = [locale, "ko"];
  for (const l of tryLocales) {
    const fullPath = path.join(postsDirectory, `${slug}.${l}.md`);
    if (fs.existsSync(fullPath)) {
      const { data, content } = matter(fs.readFileSync(fullPath, "utf8"));
      return buildPost(slug, l, data, content);
    }
  }

  // 2. 헤더 언어 방식
  const plainPath = path.join(postsDirectory, `${slug}.md`);
  if (fs.existsSync(plainPath)) {
    const { data, content } = matter(fs.readFileSync(plainPath, "utf8"));
    const lang: string = (data.language as string) || "all";
    if (languageHeaderMatchesLocale(lang, locale)) {
      return buildPost(slug, locale, data, content);
    }
  }

  return null;
}

export async function renderMarkdown(content: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkBreaks)
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeKatex)
    .use(rehypeStringify)
    .process(content);
  return result.toString();
}

export function getAllTags(locale: string): string[] {
  const posts = getPostsByLocale(locale);
  const tagSet = new Set<string>();
  posts.forEach((p) => p.tags.forEach((t) => tagSet.add(t)));
  return Array.from(tagSet);
}

export function getTopTags(locale: string, limit = 20): string[] {
  const posts = getPostsByLocale(locale);
  const countMap = new Map<string, { count: number; date: string }>();
  for (const post of posts) {
    for (const tag of post.tags) {
      const existing = countMap.get(tag);
      if (!existing || post.date > existing.date) {
        countMap.set(tag, { count: (existing?.count ?? 0) + 1, date: post.date });
      } else {
        countMap.set(tag, { count: existing.count + 1, date: existing.date });
      }
    }
  }
  return Array.from(countMap.entries())
    .sort((a, b) => b[1].count - a[1].count || b[1].date.localeCompare(a[1].date))
    .slice(0, limit)
    .map(([tag]) => tag);
}
