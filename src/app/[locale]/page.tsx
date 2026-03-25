import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getPostsByLocale, getTopTags } from "@/lib/posts";

type Props = {
  params: Promise<{ locale: string }>;
};

const HOME_META: Record<string, { title: string; description: string }> = {
  ko: {
    title: "최재형 Jaehyung Choi — CFO · Finance · Web3",
    description: "삼성전자·네이버·LINE에 걸쳐 20여년 간 재무와 경영을 다뤄왔습니다.",
  },
  en: {
    title: "Jaehyung Choi — CFO · Finance · Web3",
    description: "20+ years of finance and management across Samsung Electronics, Naver, and LINE.",
  },
  ja: {
    title: "崔在亨 Jaehyung Choi — CFO · Finance · Web3",
    description: "サムスン電子・Naver・LINEで20年以上の財務・経営の経験を持つCFOです。",
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const meta = HOME_META[locale] ?? HOME_META.ko;
  return {
    title: { absolute: meta.title },
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `https://roarion.me/${locale}`,
    },
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });

  const recentPosts = getPostsByLocale(locale).slice(0, 5);
  const tags = getTopTags(locale, 20);

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative min-h-[70svh] flex flex-col justify-center overflow-hidden">

        {/* Background photo */}
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=1920&q=85&auto=format&fit=crop"
            alt="Mountain landscape"
            fill
            sizes="100vw"
            className="object-cover object-center"
            priority
          />
        </div>
        {/* Warm light overlay for text readability */}
        <div className="absolute inset-0 bg-white/30" />

        {/* Hero text */}
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center pb-24 sm:pb-32">
          <h1 className="text-4xl sm:text-6xl font-bold text-stone-800 leading-tight tracking-tight mb-6">
            Writing things down,<br />
            <span className="italic text-stone-600">as freely as I can.</span>
          </h1>
          <p className="text-base sm:text-lg text-stone-700 leading-relaxed max-w-xl mx-auto mb-10">
            Whatever&apos;s on my mind — books, ideas, and questions I can&apos;t shake.
          </p>
          <Link
            href={`/${locale}/articles`}
            className="inline-flex items-center gap-2 px-6 py-3 border border-stone-400 text-stone-700 text-sm font-medium rounded-full hover:border-stone-600 hover:text-stone-900 hover:bg-white/40 transition-all duration-200"
          >
            Read the notes
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-stone-400 animate-bounce z-10">
          <span className="text-xs tracking-widest uppercase">scroll</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ── Tags ─────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-base font-bold tracking-[0.2em] text-gray-500 uppercase mb-8">
            Topics
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {tags.map((tag) => (
              <Link
                key={tag}
                href={`/${locale}/articles?tag=${encodeURIComponent(tag)}`}
                className="px-4 py-2 rounded-full border border-gray-200 text-sm text-gray-600 hover:border-gray-800 hover:text-gray-900 transition-all duration-150"
              >
                #{tag}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Recent Articles ───────────────────────────────── */}
      <section className="py-20 sm:py-28 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-between mb-10">
            <p className="text-base font-bold tracking-[0.2em] text-gray-500 uppercase">
              Recent Articles
            </p>
            <Link
              href={`/${locale}/articles`}
              className="text-sm text-gray-400 hover:text-gray-900 transition-colors flex items-center gap-1"
            >
              {t("view_all")}
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {recentPosts.length === 0 ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4">
              {recentPosts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/${locale}/articles/${post.slug}`}
                  className="group bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {post.tags.map((tag) => (
                          <span key={tag} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 group-hover:text-black mb-1.5 truncate">
                        {post.title}
                      </h3>
                      <p className="text-sm text-gray-500 line-clamp-1">{post.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className="text-xs text-gray-400">
                        {new Date(post.date).toLocaleDateString(
                          locale === "ko" ? "ko-KR" : locale === "ja" ? "ja-JP" : "en-US",
                          { year: "numeric", month: "short", day: "numeric" }
                        )}
                      </span>
                      <span className="text-gray-300 group-hover:text-gray-600 transition-colors text-lg">→</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Closing line ─────────────────────────────────── */}
      <section className="py-16 bg-white text-center">
        <div className="max-w-xl mx-auto px-6">
          <Link
            href={`/${locale}/about`}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            More about me
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}
