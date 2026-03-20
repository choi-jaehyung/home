import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkHtml from "remark-html";

export type Post = {
  slug: string;
  locale: string;
  title: string;
  date: string;
  tags: string[];
  description: string;
  published: boolean;
  content: string;
};

const postsDirectory = path.join(process.cwd(), "content/posts");

export function getPostsByLocale(locale: string): Post[] {
  if (!fs.existsSync(postsDirectory)) return [];

  const files = fs.readdirSync(postsDirectory);
  return files
    .filter((f) => f.endsWith(`.${locale}.md`))
    .map((filename) => {
      const slug = filename.replace(`.${locale}.md`, "");
      const fullPath = path.join(postsDirectory, filename);
      const { data, content } = matter(fs.readFileSync(fullPath, "utf8"));
      return {
        slug,
        locale,
        title: data.title || "",
        date: data.date ? String(data.date) : "",
        tags: data.tags || [],
        description: data.description || "",
        published: data.published !== false,
        content,
      };
    })
    .filter((p) => p.published)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPost(slug: string, locale: string): Post | null {
  const tryLocales = [locale, "ko"];
  for (const l of tryLocales) {
    const fullPath = path.join(postsDirectory, `${slug}.${l}.md`);
    if (fs.existsSync(fullPath)) {
      const { data, content } = matter(fs.readFileSync(fullPath, "utf8"));
      return {
        slug,
        locale: l,
        title: data.title || "",
        date: data.date ? String(data.date) : "",
        tags: data.tags || [],
        description: data.description || "",
        published: data.published !== false,
        content,
      };
    }
  }
  return null;
}

export async function renderMarkdown(content: string): Promise<string> {
  const result = await remark().use(remarkHtml).process(content);
  return result.toString();
}

export function getAllTags(locale: string): string[] {
  const posts = getPostsByLocale(locale);
  const tagSet = new Set<string>();
  posts.forEach((p) => p.tags.forEach((t) => tagSet.add(t)));
  return Array.from(tagSet);
}
