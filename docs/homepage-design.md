# 홈페이지 첫화면 기획 최종본

> 최종 확정: 2026-03-21

---

## 컨셉

직함이나 경력보다 **감각과 관심사**가 먼저 전달되는 페이지.
헤드헌터 향 메시지를 직접적으로 내세우지 않고, 이 공간이 **생각을 자유롭게 풀어내는 곳**임을 나타낸다.

---

## 레이아웃 구성 (위→아래)

### 1. Header (상단 고정)

| 항목 | 내용 |
|------|------|
| 위치 | sticky top-0, 전체 페이지에서 고정 노출 |
| 높이 | `h-[4.6rem]` |
| 좌측 | 로고 이미지 (`/public/logo.png`, `h-14`) |
| 우측 | 네비게이션 + 언어 전환 |
| 네비게이션 폰트 | `text-base font-bold` |
| 언어 | 한국어 / English / 日本語 |
| 배경 | `bg-white/80 backdrop-blur-sm` |

---

### 2. Hero Section

| 항목 | 내용 |
|------|------|
| 높이 | `min-h-[70svh]` (Safari/Chrome 크로스브라우저 대응) |
| 배경 | Unsplash 실제 자연 사진 — 따스한 파스텔톤 산악 호수 풍경 |
| 배경 처리 | `next/image fill + object-cover`, 흰색 오버레이 `bg-white/30` |
| 텍스트 정렬 | 가운데 정렬 |

**텍스트 구성**

```
(h1, 두 줄)
Writing things down,
as freely as I can.

(subtitle)
Whatever's on my mind — books, ideas, and questions I can't shake.

(CTA 버튼)
Read the notes →  (Articles 페이지로 이동)
```

**스타일**
- h1: `text-4xl sm:text-6xl font-light text-stone-800`
- italic 강조: `text-stone-600`
- subtitle: `text-base sm:text-lg text-stone-700`
- CTA 버튼: `border border-stone-400`, rounded-full, hover 시 배경 `white/40`

**제거 항목**
- 프로필 사진 없음
- "Jaehyung Choi" 텍스트 없음 (로고에서만 노출)

---

### 3. Topics (태그 클라우드)

| 항목 | 내용 |
|------|------|
| 배경 | `bg-white` |
| 섹션 제목 | `TOPICS` (small caps, tracking wide) |
| 태그 정렬 | 가운데 정렬 (`justify-center`) |
| 기본 태그 | `#poetry` `#science` `#history` |
| 동적 태그 | MD 글 파일에 포함된 태그 자동 수집 → 기본 태그와 병합하여 표시 |
| 태그 클릭 | `/[locale]/articles?tag=태그명` 으로 이동 (Articles 태그 필터) |
| 스타일 | `border border-gray-200 rounded-full`, hover 시 `border-gray-800` |

---

### 4. Recent Articles

| 항목 | 내용 |
|------|------|
| 배경 | `bg-gray-50` |
| 표시 글 수 | 최신 3편 |
| 표시 항목 | 제목, 태그, 날짜, 요약(1줄) |
| 우측 상단 | `View All →` 링크 (Articles 전체 목록으로 이동) |
| 카드 스타일 | 흰 배경 rounded-2xl, hover 시 shadow |

---

### 5. Closing Line

| 항목 | 내용 |
|------|------|
| 배경 | `bg-white` |
| 텍스트 | `Working in Seoul. Occasionally in Tokyo and San Francisco.` |
| 링크 | `More about me →` (About 페이지로 이동) |
| 스타일 | 가운데 정렬, `text-sm text-gray-400` |

---

## 기술 사항

| 항목 | 내용 |
|------|------|
| 배경 이미지 소스 | Unsplash CDN (`images.unsplash.com`) |
| 이미지 도메인 설정 | `next.config.ts` → `remotePatterns` 에 등록 |
| vh 단위 | `svh` 사용 (Safari `vh` 버그 대응) |
| 태그 수집 함수 | `src/lib/posts.ts` → `getAllTags(locale)` |
| 기본 태그 상수 | `page.tsx` → `DEFAULT_TAGS = ["poetry", "science", "history"]` |

---

## 향후 수정 포인트

- 배경 이미지: 대표님 직접 촬영 사진으로 교체 가능 (`/public/hero.jpg` 로 저장 후 src 변경)
- 기본 태그: `DEFAULT_TAGS` 배열 수정으로 변경
- Tagline: `page.tsx` h1 텍스트 직접 수정
- Closing Line 문구: `page.tsx` 하단 section 텍스트 직접 수정
