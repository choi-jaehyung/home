import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "works" });
  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

const works = [
  {
    slug: "cross-poker",
    emoji: "🃏",
    titleKey: "cross_poker.title",
    descKey: "cross_poker.description",
    tags: ["puzzle", "game", "vibe_coding"],
  },
];

export default async function WorksPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "works" });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-1">{t("title")}</h1>
        <p className="text-sm text-gray-400">{t("subtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {works.map((work) => (
          <Link
            key={work.slug}
            href={`/${locale}/works/${work.slug}`}
            className="group bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-300 hover:shadow-md transition-all"
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl">{work.emoji}</span>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-gray-900 group-hover:text-black mb-1.5">
                  {t(work.titleKey as Parameters<typeof t>[0])}
                </h2>
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                  {t(work.descKey as Parameters<typeof t>[0])}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {work.tags.map((tag) => (
                    <span key={tag} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
              <span className="text-gray-300 group-hover:text-gray-600 transition-colors text-lg mt-1">→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
