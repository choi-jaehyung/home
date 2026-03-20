import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return { title: t("title") };
}

const skills = [
  {
    category: "경영 · 전략",
    icon: "🏢",
    items: ["스타트업 경영", "사업 전략 수립", "투자 유치"],
  },
  {
    category: "기술 · 제품",
    icon: "⚙️",
    items: ["제품 기획", "AI / 데이터", "개발 이해"],
  },
  {
    category: "커뮤니케이션",
    icon: "🌐",
    items: ["글쓰기", "강의 · 발표", "한 · 영 · 일"],
  },
];

const contacts = [
  {
    label: "Email",
    href: "mailto:hello@example.com",
    value: "hello@example.com",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "#",
    value: "linkedin.com/in/jaehyungchoi",
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    label: "GitHub",
    href: "#",
    value: "github.com/jaehyungchoi",
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
      </svg>
    ),
  },
];

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-gray-700 rounded-3xl p-8 sm:p-12 mb-16 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-8">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden ring-4 ring-white/20 flex-shrink-0 shadow-2xl">
            <Image
              src="/profile.png"
              alt="Jaehyung Choi"
              width={112}
              height={112}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">Jaehyung Choi</h1>
            <p className="text-gray-300 text-sm mb-4">CEO · Entrepreneur · Writer</p>
            <p className="text-gray-300 leading-relaxed max-w-lg text-sm sm:text-base">
              기술과 경영의 경계에서 새로운 가능성을 탐구하는 기업가입니다.
              다양한 산업에서의 경험을 바탕으로 사람과 기술을 연결하는 일을 합니다.
            </p>
          </div>
        </div>
      </div>

      {/* Skills */}
      <section className="mb-16">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">{t("skills")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {skills.map((group) => (
            <div
              key={group.category}
              className="bg-gray-50 hover:bg-gray-100 rounded-2xl p-6 transition-colors border border-transparent hover:border-gray-200"
            >
              <div className="text-2xl mb-3">{group.icon}</div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                {group.category}
              </p>
              <ul className="space-y-2">
                {group.items.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-6">{t("contact")}</h2>
        <div className="grid gap-3">
          {contacts.map((c) => (
            <a
              key={c.label}
              href={c.href}
              className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl border border-transparent hover:border-gray-200 transition-all group"
            >
              <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center text-gray-500 group-hover:text-gray-900 transition-colors flex-shrink-0">
                {c.icon}
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">{c.label}</p>
                <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                  {c.value}
                </p>
              </div>
              <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500 ml-auto transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
