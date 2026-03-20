import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "career" });
  return { title: t("title") };
}

const careers = [
  {
    company: "회사명 A",
    role: "대표이사 / CEO",
    period: "2022.01 — 현재",
    current: true,
    description:
      "회사 소개 및 주요 업무 내용을 여기에 작성합니다. 어떤 제품을 만들었고, 어떤 성과를 냈는지 간략히 기술합니다.",
    tags: ["스타트업", "AI", "B2B"],
  },
  {
    company: "회사명 B",
    role: "Product Manager",
    period: "2019.03 — 2021.12",
    current: false,
    description:
      "담당했던 제품과 역할, 주요 성과를 기술합니다. 팀 규모나 프로젝트 규모를 언급하면 좋습니다.",
    tags: ["제품 기획", "데이터 분석"],
  },
  {
    company: "회사명 C",
    role: "Software Engineer",
    period: "2016.07 — 2019.02",
    current: false,
    description:
      "개발자로 일했던 경험을 기술합니다. 사용한 기술 스택이나 주요 프로젝트를 언급합니다.",
    tags: ["Backend", "Python", "AWS"],
  },
];

export default async function CareerPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "career" });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      {/* Header */}
      <div className="flex items-start justify-between mb-14">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
            {t("title")}
          </h1>
          <p className="text-gray-400 text-sm">{careers.length}개 직장 · {new Date().getFullYear() - 2016}년 경력</p>
        </div>
        <a
          href="/resume.pdf"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-700 transition-colors shadow-sm"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {t("download_resume")}
        </a>
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {careers.map((career, idx) => (
          <div
            key={idx}
            className={`relative rounded-2xl p-6 sm:p-8 border transition-all ${
              career.current
                ? "bg-gray-900 border-gray-800 text-white"
                : "bg-gray-50 border-gray-100 hover:border-gray-200 hover:bg-white hover:shadow-sm"
            }`}
          >
            {career.current && (
              <span className="absolute top-6 right-6 inline-flex items-center gap-1.5 text-xs font-medium text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                재직 중
              </span>
            )}

            <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-6 mb-3">
              <div className="flex-1">
                <h2 className={`text-lg font-semibold mb-0.5 ${career.current ? "text-white" : "text-gray-900"}`}>
                  {career.company}
                </h2>
                <p className={`text-sm font-medium ${career.current ? "text-gray-400" : "text-gray-500"}`}>
                  {career.role}
                </p>
              </div>
              <span className={`text-xs flex-shrink-0 mt-0.5 ${career.current ? "text-gray-500" : "text-gray-400"}`}>
                {career.period}
              </span>
            </div>

            <p className={`text-sm leading-relaxed mb-5 ${career.current ? "text-gray-300" : "text-gray-600"}`}>
              {career.description}
            </p>

            <div className="flex flex-wrap gap-2">
              {career.tags.map((tag) => (
                <span
                  key={tag}
                  className={`text-xs px-2.5 py-1 rounded-full ${
                    career.current
                      ? "bg-white/10 text-gray-300"
                      : "bg-white border border-gray-200 text-gray-500"
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
