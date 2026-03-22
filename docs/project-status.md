# 홈페이지 프로젝트 현황

> 최종 업데이트: 2026-03-23 (Phase 7 인증 이슈 완전 해결)

## 프로젝트 정보

| 항목 | 내용 |
|------|------|
| GitHub | choi-jaehyung/home |
| 프로덕션 URL | https://roarion.me |
| Vercel 리전 | 서울 (icn1) |
| Supabase URL | https://ofsbfpbrxvzranivoefy.supabase.co |

---

## ⚠️ Vercel 프로젝트 구조 (반드시 숙지)

Vercel에 **프로젝트가 두 개** 존재함:

| 프로젝트명 | URL | 설명 |
|-----------|-----|------|
| `home` | **https://roarion.me** | 실제 서비스 중인 프로젝트 |
| `homepage` | https://homepage-two-self.vercel.app | 초기 설정 잔존 프로젝트 (사용 안 함) |

**배포 및 환경변수 설정은 반드시 `home` 프로젝트 기준으로 해야 함.**

```bash
# 로컬 저장소가 home 프로젝트에 링크되어 있는지 확인
cat .vercel/project.json
# → projectName: "home" 이어야 함

# home 프로젝트로 재링크가 필요한 경우
vercel link --project home --yes
```

### home 프로젝트 환경변수 목록

| 변수 | 환경 | 설명 |
|------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | All | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All | Supabase Anon(Publishable) Key |
| `ADMIN_EMAIL` | Production | 어드민 Google 이메일 (`writer.jaehyung@gmail.com`) |
| `GITHUB_TOKEN` | Production | GitHub PAT (Contents 읽기/쓰기 권한) |
| `GITHUB_OWNER` | Production | `choi-jaehyung` |
| `GITHUB_REPO` | Production | `home` |

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

### Phase 4 — Supabase 연동
- 좋아요 기능 (LikeButton, API route)
- 댓글 기능 (CommentSection, API route)
- Google OAuth 로그인

### Phase 5 — 배포 및 운영
- Vercel 배포 완료 (GitHub 연동 자동 배포)
- 커스텀 도메인 연결: `roarion.me` (Vercel에서 구매)
- Supabase OAuth 콜백 URL 수정 완료

### Phase 7 — MD 업로더 ✅ (2026-03-23 완전 완료)
- 로컬 .md 파일 → 브라우저 업로드 → GitHub `content/posts/` 자동 커밋
- 동일 파일명 덮어쓰기 / 취소 확인 모달
- Google OAuth + 어드민 이메일 검증 접근 제어
- 어드민 URL: `https://roarion.me/ko/admin/upload`
- Articles 페이지 "Writings" 타이틀 옆 Admin 링크 노출
- 비어드민 계정 로그인 시 로그아웃 버튼 포함한 접근 거부 화면
- 자세한 내용: `docs/phase7-md-uploader.md`

---

## 포스팅 가이드

### MD 파일 frontmatter 형식

```yaml
---
title: 포스팅 제목
date: 2026-03-23
tags: tag1, tag2
description: 요약 설명
published: true
language: ko
image: /images/my-photo.jpg   # 선택사항 (없으면 기본 이미지 사용)
---
```

### 포스팅 이미지 사용법
1. GitHub 웹에서 `public/images/` 폴더에 이미지 파일 업로드
2. Vercel 배포 완료 후 (GitHub 커밋 옆 ✅ 확인)
3. MD frontmatter에 `image: /images/파일명.jpg` 지정 후 업로더로 업로드

### Vercel 배포 완료 확인 방법
- GitHub 저장소 커밋 목록에서 커밋 옆 아이콘 확인
  - 🟡 노란 점 → 빌드 중
  - ✅ 초록 체크 → 배포 완료
  - ❌ 빨간 X → 빌드 실패

---

## UI 수정 이력

| 날짜 | 내용 |
|------|------|
| 2026-03-22 | About 페이지 섹션 순서 변경: Expertise → Press → Career → Contact |
| 2026-03-22 | About 페이지 Career 헤더에 "자세히 보기 →" 링크 추가 |
| 2026-03-22 | 모바일 프로필 사진 프레임 빈 공간 제거 |
| 2026-03-22 | 포스팅 페이지 뒤로가기 텍스트: "글" → "글 목록" |
| 2026-03-22 | Articles 페이지 Writings 타이틀 옆 Admin 링크 추가 |

---

## 트러블슈팅 기록

### Google OAuth 후 Vercel 로그인 페이지 리다이렉트 — 해결 (2026-03-22)

**원인:** Supabase Site URL이 프리뷰 배포 URL로 설정되어 있었음

**해결:** Supabase > Authentication > URL Configuration 수정
- Site URL: `https://roarion.me`
- Redirect URLs: `https://roarion.me/*`, `https://www.roarion.me/*`, `http://localhost:3000/*`

---

### MD 업로더 어드민 인증 실패 — 해결 (2026-03-23)

**증상:** `writer.jaehyung@gmail.com`으로 로그인해도 "접근 권한이 없습니다" 화면 표시

**원인 1 (SSR 클라이언트 문제):** `createServerSupabaseClient`로 Bearer 토큰 검증 시 프로덕션에서 null 반환
- **해결:** `@supabase/supabase-js`의 `createClient` 직접 사용으로 변경

**원인 2 (잘못된 Vercel 프로젝트):** Vercel 프로젝트가 `homepage`와 `home` 두 개 존재. 환경변수를 `homepage` 프로젝트에만 설정하고 `home` 프로젝트에는 미설정 상태였음. `roarion.me`는 `home` 프로젝트를 서비스 중.
- **해결:** `home` 프로젝트에 4개 환경변수 추가 후 재배포

---

### 한글 파일명 중복 업로드 — 해결 (2026-03-22)

**원인:** macOS는 파일명을 NFD 인코딩으로 전송, GitHub은 NFC로 저장. 존재 확인 요청이 NFD로 가서 매칭 실패 → 중복 파일 생성

**해결:** API route에서 `filename.normalize("NFC")` 처리 후 GitHub API 호출

---

### git push 후 MD 업로더로 올린 파일 삭제 위험 — 주의사항 (2026-03-22)

MD 업로더로 업로드한 파일은 GitHub에만 존재하고 로컬에는 없음. `git push --force` 사용 시 해당 파일 전부 삭제됨.

**규칙:** 배포 전 반드시 `git pull` 먼저 실행. `git push --force` 절대 사용 금지.

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
