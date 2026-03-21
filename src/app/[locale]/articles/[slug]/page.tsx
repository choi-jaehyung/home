import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { getPost, renderMarkdown } from "@/lib/posts";
import LikeButton from "@/components/LikeButton";
import CommentSection from "@/components/CommentSection";

const DEFAULT_HERO_IMAGE =
  "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=1600&q=80&auto=format&fit=crop";

const FONT_MAP: Record<string, string> = {
  sans: "var(--font-geist-sans), system-ui, sans-serif",
  serif: "Georgia, Cambria, 'Times New Roman', serif",
  mono: "var(--font-geist-mono), monospace",
  "nanum-myeongjo": "var(--font-nanum-myeongjo), serif",
  "nanum-gothic": "var(--font-nanum-gothic), sans-serif",
  "line-seed": "var(--font-line-seed), sans-serif",
};

const FONT_SIZE_MAP: Record<string, string> = {
  sm: "0.875rem",
  base: "1rem",
  lg: "1.125rem",
  xl: "1.25rem",
};

const LINE_HEIGHT_MAP: Record<string, string> = {
  tight: "1.4",
  normal: "1.6",
  relaxed: "1.8",
  loose: "2.2",
};

const PARA_SPACING_MAP: Record<string, string> = {
  tight: "0.5rem",
  normal: "1rem",
  relaxed: "1.5rem",
  loose: "2rem",
};

function resolve(map: Record<string, string>, value: string | undefined, fallback: string): string {
  if (!value) return map[fallback];
  return map[value] ?? value;
}

function isExternalUrl(src: string): boolean {
  return src.startsWith("http://") || src.startsWith("https://");
}

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const post = getPost(slug, locale);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
  };
}

export default async function ArticlePage({ params }: Props) {
  const { locale, slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const post = getPost(slug, locale);
  if (!post) notFound();

  const t = await getTranslations({ locale, namespace: "articles" });
  const contentHtml = await renderMarkdown(post.content);

  return (
    <div>
      {/* Article Hero */}
      <div className="relative overflow-hidden" style={{ minHeight: "38vh" }}>
        <Image
          src={post.image || DEFAULT_HERO_IMAGE}
          alt={post.title}
          fill
          className="object-cover object-center"
          priority
          unoptimized={!!(post.image && isExternalUrl(post.image) && !post.image.includes("unsplash.com"))}
        />
        <div className="absolute inset-0 bg-black/65" />

        <div className="relative z-10 max-w-2xl mx-auto px-6 py-16 sm:py-24 text-white">
          <Link
            href={`/${locale}/articles`}
            className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors mb-8"
          >
            ← {t("title")}
          </Link>

          <div className="flex flex-wrap gap-2 mb-5">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2.5 py-1 bg-white/15 text-white/80 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>

          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight leading-tight mb-6">
            {post.title}
          </h1>

          <time className="text-sm text-white/50">
            {new Date(post.date).toLocaleDateString(
              locale === "ko" ? "ko-KR" : locale === "ja" ? "ja-JP" : "en-US",
              { year: "numeric", month: "long", day: "numeric" }
            )}
          </time>
        </div>
      </div>

      {/* Article Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <article
          className="prose-article max-w-2xl"
          style={{
            fontFamily: FONT_MAP[post.font || "sans"] ?? FONT_MAP.sans,
            fontSize: FONT_SIZE_MAP[post.fontSize || "base"] ?? FONT_SIZE_MAP.base,
            lineHeight: resolve(LINE_HEIGHT_MAP, post.lineHeight, "relaxed"),
            ["--para-spacing" as string]: resolve(PARA_SPACING_MAP, post.paragraphSpacing, "normal"),
          }}
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />

        <div className="mt-12 pt-10 border-t border-gray-100 flex justify-center">
          <LikeButton slug={slug} />
        </div>

        <div className="max-w-2xl">
          <CommentSection slug={slug} locale={locale} />
        </div>
      </div>
    </div>
  );
}
