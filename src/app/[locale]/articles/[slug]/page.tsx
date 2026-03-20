import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getPost, renderMarkdown } from "@/lib/posts";
import { getTranslations } from "next-intl/server";
import LikeButton from "@/components/LikeButton";
import CommentSection from "@/components/CommentSection";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = getPost(slug, locale);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
  };
}

export async function generateStaticParams() {
  return [];
}

export default async function ArticlePage({ params }: Props) {
  const { locale, slug } = await params;
  const post = getPost(slug, locale);
  if (!post) notFound();

  const t = await getTranslations({ locale, namespace: "articles" });
  const contentHtml = await renderMarkdown(post.content);

  return (
    <div>
      {/* Article Header Banner */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <Link
            href={`/${locale}/articles`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-8"
          >
            ← {t("title")}
          </Link>

          <div className="flex flex-wrap gap-2 mb-5">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2.5 py-1 bg-white/10 text-gray-300 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight leading-tight mb-5">
            {post.title}
          </h1>
          <p className="text-gray-400 text-sm mb-8">{post.description}</p>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-white/20">
              <Image
                src="/profile.png"
                alt="Jaehyung Choi"
                width={36}
                height={36}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-sm font-medium">Jaehyung Choi</p>
              <time className="text-xs text-gray-400">
                {new Date(post.date).toLocaleDateString(
                  locale === "ko" ? "ko-KR" : locale === "ja" ? "ja-JP" : "en-US",
                  { year: "numeric", month: "long", day: "numeric" }
                )}
              </time>
            </div>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <article
          className="prose-article max-w-2xl"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />

        {/* Like Button */}
        <div className="mt-12 pt-10 border-t border-gray-100 flex justify-center">
          <LikeButton slug={slug} />
        </div>

        {/* Comments */}
        <div className="max-w-2xl">
          <CommentSection slug={slug} locale={locale} />
        </div>
      </div>
    </div>
  );
}
