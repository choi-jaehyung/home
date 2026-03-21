# 홈페이지 프로젝트 현황

> 최종 업데이트: 2026-03-22

## 프로젝트 정보

| 항목 | 내용 |
|------|------|
| GitHub | choi-jaehyung/home |
| 프로덕션 URL | https://roarion.me |
| Vercel 리전 | 서울 (icn1) |
| Supabase URL | https://ofsbfpbrxvzranivoefy.supabase.co |

---

## 완료된 작업

### Phase 1 — 기반 구성
- Next.js + TypeScript + Tailwind CSS
- next-intl 다국어 지원 (ko / en / ja)
- Header / Footer 공통 컴포넌트

### Phase 2 — 주요 페이지
- About 페이지: 프로필 배너, Expertise 카드, Press, Career 타임라인, Contact
- Career 페이지: 상세 타임라인 카드

### Phase 3 — Articles 시스템
- Markdown 파일 기반 포스팅 (`content/posts/`)
- gray-matter + remark 파싱
- 태그 필터, 글 상세 페이지
- 포스팅 업로드 방법: GitHub 웹 (`content/posts/` 폴더에 md 파일 업로드)

### Phase 4 — Supabase 연동
- 좋아요 기능 (LikeButton, API route)
- 댓글 기능 (CommentSection, API route)
- Google OAuth 로그인

### Phase 5 — 배포 및 운영
- Vercel 배포 완료 (GitHub 연동 자동 배포)
- 커스텀 도메인 연결: `roarion.me` (Vercel에서 구매)
- Supabase OAuth 콜백 URL 수정 완료

---

## UI 수정 이력

| 날짜 | 내용 |
|------|------|
| 2026-03-22 | About 페이지 섹션 순서 변경: Expertise → Press → Career → Contact |
| 2026-03-22 | About 페이지 Career 헤더에 "자세히 보기 →" 링크 추가 (Career 페이지로 이동) |
| 2026-03-22 | 모바일 프로필 사진 프레임 빈 공간 제거 |
| 2026-03-22 | 포스팅 페이지 뒤로가기 텍스트: "글" → "글 목록" (en: Lists, ja: 一覧) |

---

## 트러블슈팅 기록

### Google OAuth 후 Vercel 로그인 페이지 리다이렉트 — 해결 (2026-03-22)

**증상:** 포스팅 페이지에서 Google 로그인 클릭 → Vercel 로그인 페이지로 이동

**원인:** Supabase Site URL이 프리뷰 배포 URL로 설정되어 있었음. Vercel 프리뷰 배포에는 기본적으로 Vercel Authentication이 활성화되어 있어, OAuth 콜백 후 해당 URL로 리다이렉트될 때 Vercel 로그인 페이지가 노출됨.

**해결:** Supabase > Authentication > URL Configuration 수정
- Site URL: `https://roarion.me`
- Redirect URLs: `https://roarion.me/*`, `https://www.roarion.me/*`, `http://localhost:3000/*`

---

## Supabase 설정 현황

| 항목 | 값 |
|------|-----|
| Site URL | https://roarion.me |
| Redirect URLs | https://roarion.me/*, https://www.roarion.me/*, http://localhost:3000/* |

---

## 남은 작업

### Phase 6 — SEO / 최적화
- [ ] metadata 설정 (title, description, OG 태그)
- [ ] sitemap.xml 생성
- [ ] robots.txt 설정
- [ ] 성능 최적화 (이미지, 폰트 등)

### Phase 7 — MD 업로더
- [ ] MD 파일을 GitHub에 직접 업로드할 수 있는 웹 업로더 페이지 제작
  - 브라우저에서 md 파일 작성 또는 업로드
  - GitHub API를 통해 `content/posts/`에 직접 커밋
  - 별도 로컬 작업 없이 포스팅 가능

---

## 주의사항

- 커스텀 도메인 변경 시 Supabase Site URL 및 Redirect URLs 업데이트 필요
- `.env.local`은 Vercel 대시보드 > Environment Variables에도 동일하게 설정되어 있어야 함
- 포스팅 md 파일 frontmatter 형식: `title`, `date`, `tags`, `excerpt` 필수
