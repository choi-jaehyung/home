import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Accept-Language 감지 비활성화 — 쿠키 우선, 없으면 한국어 기본값
const handleI18nRouting = createMiddleware({
  locales: ['ko', 'en', 'ja'],
  defaultLocale: 'ko',
  localeDetection: false,
});

const LOCALES = ['ko', 'en', 'ja'] as const;
type Locale = (typeof LOCALES)[number];
const COOKIE = 'NEXT_LOCALE';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // URL에 locale prefix가 있는 경우: 해당 locale을 쿠키에 저장
  const urlLocale = LOCALES.find(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)
  );
  if (urlLocale) {
    const response = handleI18nRouting(request);
    response.cookies.set(COOKIE, urlLocale, {
      path: '/',
      maxAge: 365 * 24 * 60 * 60, // 1년
      sameSite: 'lax',
    });
    return response;
  }

  // URL에 locale 없음: 저장된 쿠키 확인 → 없으면 기본값 ko
  const saved = request.cookies.get(COOKIE)?.value as Locale | undefined;
  const target: Locale = saved && LOCALES.includes(saved) ? saved : 'ko';

  if (target !== 'ko') {
    // 저장된 locale이 ko가 아니면 해당 locale로 리다이렉트
    const url = request.nextUrl.clone();
    url.pathname = `/${target}${pathname === '/' ? '' : pathname}`;
    return NextResponse.redirect(url);
  }

  // ko(기본값)는 next-intl이 처리
  return handleI18nRouting(request);
}

export const config = {
  matcher: ['/((?!api|auth|_next|_vercel|.*\\..*).*)'],
};
