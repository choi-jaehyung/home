import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getPostsByLocale } from "@/lib/posts";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  return { title: t("hero_title") };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  const tNav = await getTranslations({ locale, namespace: "nav" });

  const recentPosts = getPostsByLocale(locale).slice(0, 3);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 sm:py-36">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-gray-100 to-transparent rounded-full blur-3xl opacity-60" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-gray-100 to-transparent rounded-full blur-3xl opacity-40" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-start gap-10 sm:gap-16">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              <div className="relative w-32 h-32 sm:w-40 sm:h-40">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 blur-md scale-105 opacity-50" />
                <div className="relative w-full h-full rounded-full overflow-hidden ring-4 ring-white shadow-xl">
                  <Image
                    src="/profile.png"
                    alt="Jaehyung Choi"
                    width={160}
                    height={160}
                    className="w-full h-full object-cover"
                    priority
                  />
                </div>
              </div>
            </div>

            {/* Text */}
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-2 text-xs font-medium text-gray-500 tracking-widest uppercase bg-gray-100 px-3 py-1.5 rounded-full mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                {t("hero_subtitle")}
              </span>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 mb-5 leading-tight">
                {t("hero_title")}
              </h1>
              <p className="text-lg text-gray-500 leading-relaxed mb-8">
                {t("hero_description")}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/${locale}/about`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-700 transition-colors shadow-sm"
                >
                  {tNav("about")}
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link
                  href={`/${locale}/articles`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-full hover:border-gray-400 hover:text-gray-900 transition-colors"
                >
                  {tNav("articles")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Articles */}
      <section className="py-16 bg-gray-50/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-semibold text-gray-900">{t("recent_articles")}</h2>
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
                          { month: "short", day: "numeric" }
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
    </div>
  );
}
