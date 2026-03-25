import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
};

const ABOUT_META: Record<string, { title: string; description: string }> = {
  ko: { title: "소개", description: "최재형 CFO — 삼성전자·네이버·LINE 20여년 재무 경력, 전문성, 연락처" },
  en: { title: "About", description: "Jaehyung Choi — CFO with 20+ years across Samsung Electronics, Naver, and LINE" },
  ja: { title: "プロフィール", description: "崔在亨 CFO — サムスン電子・Naver・LINEでの20年以上の財務経歴" },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const meta = ABOUT_META[locale] ?? ABOUT_META.ko;
  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `https://roarion.me/${locale}/about`,
      images: [{ url: "/profile.png", width: 400, height: 400 }],
    },
  };
}

const timeline = [
  {
    period: "2014 – Present",
    company: "LINE Group / LINE NEXT",
    role: "CFO",
    location: "Seoul · Tokyo",
    highlights: [
      { text: "Crescendo(PE)로부터 1,800억원 투자 유치 리드", link: "https://n.news.naver.com/article/366/0000954577" },
      { text: "Web3 전문기업 LINE NEXT CFO 취임" },
      { text: "일본 자금결제법 사업면허 취득 리드 (2014), LINE Pay Japan CFO 취임" },
      { text: "대만 LINE Pay 법인 대만증권시장 상장 지원 (2024)" },
      { text: "LINE Xenesis (일본 가상화폐 거래소) 설립 및 재무 셋업" },
    ],
  },
  {
    period: "2008 – 2014",
    company: "Naver",
    role: "Finance / CFO 직속",
    location: "Seoul · Tokyo (주재원 2012~)",
    highlights: [
      { text: "네이버 쇼핑부문 경영계획 수립 및 예산관리" },
      { text: "물적분할을 통한 자회사 설립 — 現 네이버 클라우드 · 네이버 파이낸셜" },
      { text: "일본 주재원 파견 — LINE 사업 초기 한국 본사 연결 역할" },
      { text: "LINE Pay 사업 런칭 PM 및 일본 결제 라이센스 취득 프로젝트 리드" },
    ],
  },
  {
    period: "2005 – 2008",
    company: "Samsung Electronics",
    role: "LCD 총괄 재무팀",
    location: "Suwon",
    highlights: [
      { text: "제품별 매출원가 결산 및 보고" },
      { text: "생산 Capa · 수율에 따른 장단기 계획 시뮬레이션" },
      { text: "Target Cost Management" },
    ],
  },
];

const expertise = [
  { label: "투자 유치", desc: "PE·VC 협상, SHA/SPA, Valuation" },
  { label: "사업 계획", desc: "장단기 경영계획, 예산관리" },
  { label: "재무 회계", desc: "결산, 재무제표 총괄, 감사 대응" },
  { label: "프로세스", desc: "의사결정 체계, 내부 통제 구축" },
  { label: "PM", desc: "라이센스 취득, 사업 런칭 리드" },
  { label: "언어", desc: "한국어 · 영어(Fluent) · 일본어(Native)" },
];

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;

  return (
    <div className="bg-gray-950 text-white min-h-screen">

      {/* ── Hero ───────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 flex flex-col sm:flex-row items-stretch gap-10">
        <div className="flex-shrink-0">
          <div className="rounded-2xl overflow-hidden ring-2 ring-white/10 shadow-2xl w-28 sm:w-36">
            <Image
              src="/profile.png"
              alt="Jaehyung Choi"
              width={144}
              height={400}
              sizes="(max-width: 640px) 112px, 144px"
              className="w-full h-auto object-cover object-top"
              priority
            />
          </div>
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-1 tracking-tight">
            최재형 <span className="text-gray-400 font-normal text-2xl sm:text-3xl">Jaehyung Choi</span>
          </h1>
          <p className="text-gray-400 text-sm mb-5 tracking-wide">CFO · Finance · Web3</p>
          <p className="text-gray-300 leading-relaxed max-w-xl text-sm sm:text-base">
            삼성전자·네이버·LINE에 걸쳐 20여년 간 재무와 경영을 다뤄왔습니다.
            투자 유치, 자회사 설립, 상장, 라이선스 취득까지 — 회사의 시작과 성장 과정 전반을 가까이서 이끌어왔습니다.
          </p>
        </div>
      </section>

      {/* ── Expertise ──────────────────────────────────── */}
      <section className="border-t border-white/8 py-14">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-xs font-bold tracking-[0.2em] text-gray-500 uppercase mb-8">Expertise</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {expertise.map((item) => (
              <div key={item.label} className="bg-white/5 hover:bg-white/8 border border-white/8 rounded-xl p-5 transition-colors">
                <p className="text-base font-semibold text-white mb-1">{item.label}</p>
                <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Press ──────────────────────────────────────── */}
      <section className="border-t border-white/8 py-14">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-xs font-bold tracking-[0.2em] text-gray-500 uppercase mb-8">Press</p>
          <div className="space-y-4">
            <a
              href="https://www.thebell.co.kr/front/newsview.asp?click=F&key=202308031505361280107523&lcode=00"
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white/5 hover:bg-white/8 border border-white/8 rounded-xl p-5 transition-colors group"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-2">더벨 · 2023.08.04</p>
                  <p className="text-sm font-semibold text-white mb-2 group-hover:text-gray-100">
                    라인, &lsquo;블록체인&rsquo; 개척 5년…최재형 제네시스 CFO 뒷심
                  </p>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    LINE NEXT(라인 제네시스) CFO로서 블록체인 사업 5년 여정을 조명. LINE Xenesis 가상자산거래소 운영, LINE NFT 구축,
                    Web3 생태계 재무 인프라 정비 등 라인의 블록체인 사업 전반을 이끈 내용을 다룸.
                  </p>
                </div>
                <svg className="w-4 h-4 text-gray-600 group-hover:text-gray-400 flex-shrink-0 mt-1 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* ── Career Timeline ─────────────────────────────── */}
      <section className="border-t border-white/8 py-14">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-between mb-12">
            <p className="text-xs font-bold tracking-[0.2em] text-gray-500 uppercase">Career</p>
            <Link href={`/${locale}/career`} className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1">
              자세히 보기
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-white/10" />

            <div className="space-y-12">
              {timeline.map((item, idx) => (
                <div key={idx} className="relative pl-10">
                  {/* Dot */}
                  <div className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full bg-gray-700 border-2 border-gray-400 flex-shrink-0" />

                  {/* Period */}
                  <p className="text-xs font-mono text-gray-500 mb-2 tracking-wider">{item.period}</p>

                  {/* Company & Role */}
                  <div className="mb-1">
                    <span className="text-lg font-bold text-white">{item.company}</span>
                    <span className="ml-3 text-sm text-gray-400">{item.role}</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-4">{item.location}</p>

                  {/* Highlights */}
                  <ul className="space-y-2">
                    {item.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300 leading-relaxed">
                        <span className="mt-2 w-1 h-1 rounded-full bg-gray-500 flex-shrink-0" />
                        {h.link ? (
                          <span>
                            {h.text}{" "}
                            <a href={h.link} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white underline underline-offset-2 text-xs transition-colors">[기사]</a>
                          </span>
                        ) : h.text}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {/* Education tail */}
              <div className="relative pl-10">
                <div className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full bg-gray-800 border-2 border-gray-600 flex-shrink-0" />
                <p className="text-xs font-mono text-gray-500 mb-2 tracking-wider">2000 – 2005</p>
                <span className="text-base font-semibold text-gray-300">Yonsei University</span>
                <span className="ml-3 text-sm text-gray-500">경영학과</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Contact ────────────────────────────────────── */}
      <section className="border-t border-white/8 py-14">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-xs font-bold tracking-[0.2em] text-gray-500 uppercase mb-6">Contact</p>
          <div className="flex flex-col gap-3">
            <a
              href="mailto:roarion@gmail.com"
              className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              roarion@gmail.com
            </a>
            <a
              href="https://www.linkedin.com/in/재형-jaehyung-최-choi-a8622975/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              LinkedIn
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
