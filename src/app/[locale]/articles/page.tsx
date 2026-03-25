import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getPostsByLocale, getAllTags } from "@/lib/posts";
import TagFilter from "@/components/TagFilter";
import { Suspense } from "react";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tag?: string }>;
};

const ARTICLES_DESC: Record<string, string> = {
  ko: "최재형의 글 모음 — 생각, 독서, 그리고 금융·Web3에 관한 기록",
  en: "Writings by Jaehyung Choi — thoughts on books, finance, and Web3",
  ja: "崔在亨の文章集 — 思考、読書、ファイナンス・Web3について",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "articles" });
  const title = t("title");
  const description = ARTICLES_DESC[locale] ?? ARTICLES_DESC.ko;
  return {
    title,
    description,
    openGraph: { title, description, url: `https://roarion.me/${locale}/articles` },
  };
}

export default async function ArticlesPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { tag } = await searchParams;
  const t = await getTranslations({ locale, namespace: "articles" });

  const posts = getPostsByLocale(locale);
  const tags = getAllTags(locale);
  const filtered = tag ? posts.filter((p) => p.tags.includes(tag)) : posts;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Writings
          </h1>
          <Link
            href={`/${locale}/admin/upload`}
            className="text-xs text-gray-400 border border-gray-200 rounded-full px-2.5 py-0.5 hover:border-gray-400 hover:text-gray-600 transition-colors"
          >
            Admin
          </Link>
        </div>
        <p className="text-sm text-gray-400">{posts.length}개의 글</p>
      </div>

      <Suspense>
        <TagFilter tags={tags} currentTag={tag} />
      </Suspense>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">📭</p>
          <p className="text-gray-400 text-sm">{t("no_results")}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((post) => (
            <Link
              key={post.slug}
              href={`/${locale}/articles/${post.slug}`}
              className="group bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-1.5 mb-2.5">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2.5 py-0.5 bg-gray-100 text-gray-500 rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <h2 className="text-base font-semibold text-gray-900 group-hover:text-black mb-1.5">
                    {post.title}
                  </h2>
                  <p className="text-sm text-gray-500 line-clamp-2">{post.description}</p>
                </div>
                <div className="flex flex-col items-end gap-3 flex-shrink-0">
                  <time className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(post.date).toLocaleDateString(
                      locale === "ko" ? "ko-KR" : locale === "ja" ? "ja-JP" : "en-US",
                      { year: "numeric", month: "short", day: "numeric" }
                    )}
                  </time>
                  <span className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-gray-900 flex items-center justify-center transition-colors">
                    <svg className="w-3.5 h-3.5 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
