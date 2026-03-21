import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Career" };
}

type Highlight = { text: string; link?: string };

type Project = {
  name: string;
  period?: string;
  note?: string;
  highlights: Highlight[];
};

type Career = {
  company: string;
  role: string;
  period: string;
  location: string;
  current?: boolean;
  projects: Project[];
};

const careers: Career[] = [
  {
    company: "LINE Group / LINE NEXT",
    role: "CFO",
    period: "2014 – Present",
    location: "Seoul · Tokyo (주재원 ~2024)",
    current: true,
    projects: [
      {
        name: "LINE NEXT",
        period: "2022 – 현재",
        highlights: [
          { text: "Web3 전문기업 LINE NEXT CFO 취임" },
          { text: "Crescendo(PE)로부터 1,800억원 투자 유치 리드", link: "https://n.news.naver.com/article/366/0000954577" },
        ],
      },
      {
        name: "LINE Pay Japan",
        period: "2014 – 2023",
        highlights: [
          { text: "일본 자금결제법 사업면허 취득 리드 (2014)" },
          { text: "LINE Pay Japan CFO 취임" },
          { text: "대만 LINE Pay 법인 대만증권시장 상장 지원" },
        ],
      },
      {
        name: "LINE Xenesis",
        period: "2018 – 현재",
        note: "겸직",
        highlights: [
          { text: "일본 가상화폐 거래소 LINE Xenesis 설립 및 재무 셋업" },
          { text: "LINE Xenesis CFO 취임" },
        ],
      },
    ],
  },
  {
    company: "Naver",
    role: "Finance / CFO 직속",
    period: "2008 – 2014",
    location: "Seoul · Tokyo (주재원 2012~)",
    projects: [
      {
        name: "Naver Corp (당시 NHN)",
        period: "2008 – 2009",
        highlights: [
          { text: "네이버 쇼핑부문 경영계획 수립 및 예산관리" },
        ],
      },
      {
        name: "Naver Business Platform",
        period: "2009 – 2012",
        highlights: [
          { text: "물적분할을 통한 자회사 설립 — 現 네이버 클라우드 · 네이버 파이낸셜" },
        ],
      },
      {
        name: "일본 주재원 · LINE Pay",
        period: "2012 – 2014",
        highlights: [
          { text: "일본 주재원 파견 — LINE 사업 초기 한국 본사 연결 역할" },
          { text: "LINE Pay 사업 런칭 PM 및 일본 결제 라이센스 취득 프로젝트 리드" },
        ],
      },
    ],
  },
  {
    company: "Samsung Electronics",
    role: "LCD 총괄 (現 삼성디스플레이) 재무팀",
    period: "2005 – 2008",
    location: "Giheung · Cheonan · Tangjung",
    projects: [
      {
        name: "LCD 총괄 재무",
        highlights: [
          { text: "제품별 매출원가 결산 및 보고" },
          { text: "생산 Capa · 수율에 따른 장단기 계획 시뮬레이션" },
          { text: "Target Cost Management" },
        ],
      },
    ],
  },
];

export default async function CareerPage({ params }: Props) {
  await params;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16">

      {/* Header */}
      <div className="mb-14">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Career</h1>
        <p className="text-gray-400 text-sm">20여년 간의 재무·경영 경력</p>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-200" />

        <div className="space-y-12">
          {careers.map((career, idx) => (
            <div key={idx} className="relative pl-10">
              {/* Dot */}
              <div className={`absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 ${
                career.current
                  ? "bg-gray-900 border-gray-900"
                  : "bg-white border-gray-400"
              }`} />

              {/* Period */}
              <p className="text-xs font-mono text-gray-400 mb-2 tracking-wider">{career.period}</p>

              {/* Company & Role */}
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1">
                <span className="text-xl font-bold text-gray-900">{career.company}</span>
                {career.current && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    재직 중
                  </span>
                )}
              </div>
              <div className="mb-1">
                <span className="text-sm font-medium text-gray-500">{career.role}</span>
              </div>
              <p className="text-xs text-gray-400 mb-6">{career.location}</p>

              {/* Projects */}
              <div className="space-y-4">
                {career.projects.map((project, pIdx) => (
                  <div key={pIdx} className="rounded-xl border border-gray-100 bg-gray-50 px-5 py-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm font-semibold text-gray-700">{project.name}</span>
                      {project.period && (
                        <span className="text-xs text-gray-400 font-mono">{project.period}</span>
                      )}
                      {project.note && (
                        <span className="text-xs text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">{project.note}</span>
                      )}
                    </div>
                    <ul className="space-y-2">
                      {project.highlights.map((h, hIdx) => (
                        <li key={hIdx} className="flex items-start gap-2.5 text-sm text-gray-600 leading-relaxed">
                          <span className="mt-2 w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
                          {h.link ? (
                            <span>
                              {h.text}{" "}
                              <a
                                href={h.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-gray-700 underline underline-offset-2 text-xs transition-colors"
                              >
                                [기사]
                              </a>
                            </span>
                          ) : h.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Education */}
          <div className="relative pl-10">
            <div className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-gray-300 flex-shrink-0" />
            <p className="text-xs font-mono text-gray-400 mb-2 tracking-wider">2000 – 2005</p>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1">
              <span className="text-xl font-bold text-gray-900">Yonsei University</span>
              <span className="text-sm font-medium text-gray-500">경영학과</span>
            </div>
            <p className="text-xs text-gray-400 mb-6">Seoul</p>
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-5 py-4">
              <ul className="space-y-2">
                <li className="flex items-start gap-2.5 text-sm text-gray-600 leading-relaxed">
                  <span className="mt-2 w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
                  2005년 2월 졸업
                </li>
                <li className="flex items-start gap-2.5 text-sm text-gray-600 leading-relaxed">
                  <span className="mt-2 w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
                  Yonsei Venture 회장 역임
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
