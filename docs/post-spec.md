# 포스팅 시스템 기획서

> 최종 확정: 2026-03-21

---

## 1. 개요

MD 파일 기반의 포스팅 시스템. 파일을 `content/posts/` 폴더에 업로드하면 자동으로 홈페이지에 반영된다. 별도의 CMS나 DB 없이 파일 시스템만으로 운영된다.

---

## 2. 파일 구조

```
content/posts/
├── 글제목.ko.md          # 한국어 전용
├── 글제목.en.md          # 영어 전용
├── 글제목.ja.md          # 일본어 전용
└── 글제목.md             # 헤더의 language 필드로 언어 지정
```

---

## 3. 언어 처리 방식

### 방식 A — 파일명 로케일
파일명에 언어 코드를 붙이는 방식. 우선순위가 가장 높다.

```
베이즈정리.ko.md   → 한국어 페이지에서만 노출
베이즈정리.en.md   → 영어 페이지에서만 노출
```

### 방식 B — frontmatter language 필드
단일 `.md` 파일에서 언어를 지정하는 방식.

```yaml
language: Korean          # 한국어만
language: Korean, English # 한국어·영어 동시 노출
language: All             # 모든 언어에서 노출
```

| 값 | 인식 키워드 |
|---|---|
| 한국어 | `Korean`, `한국어`, `ko` |
| 영어 | `English`, `영어`, `en` |
| 일본어 | `Japanese`, `일본어`, `日本語`, `ja` |
| 전체 | `All`, `전체`, `*` |

### 폴백 규칙
영어/일본어 페이지에서 해당 언어 파일이 없을 경우 한국어(`.ko.md`) 파일을 대신 표시한다.

---

## 4. Frontmatter 전체 스펙

```yaml
---
title: 글 제목                        # 필수
date: 2026-03-21                      # 필수. YYYY-MM-DD
tags:                                 # 필수 (빈 배열 가능)
  - tag1
  - tag2
language: All                         # 선택. 방식 B 사용 시 필수
description: 글 요약                   # 선택. SEO 및 목록 카드에 표시
published: true                       # 선택. false면 비공개 (기본값: true)
image: /images/example.jpg            # 선택. hero 배경이미지. 미지정시 기본 이미지 사용
font: line-seed                       # 선택. 폰트 (기본값: sans)
fontSize: base                        # 선택. 폰트 크기 (기본값: base)
lineHeight: 1.8                       # 선택. 줄간격 (기본값: relaxed = 1.8)
paragraphSpacing: normal              # 선택. 단락 간격 (기본값: normal = 1rem)
---
```

---

## 5. Typography 설정

### 5-1. font — 폰트

| 값 | 적용 폰트 | 특징 |
|---|---|---|
| `sans` *(디폴트)* | Geist Sans, system-ui | 깔끔하고 현대적 |
| `serif` | Georgia, Cambria, Times New Roman | 클래식하고 문학적 |
| `mono` | Geist Mono | 코드/기술 글 |
| `nanum-myeongjo` | 나눔명조 | 한국어 명조체, 문학적 |
| `nanum-gothic` | 나눔고딕 | 한국어 고딕체, 깔끔한 본문 |
| `line-seed` | LINE Seed KR | 사이트 기본 폰트, 모던한 느낌 |

> 사이트 전체 기본 폰트: **LINE Seed KR**

### 5-2. fontSize — 폰트 크기

| 값 | 크기 | 용도 |
|---|---|---|
| `sm` | 0.875rem (14px) | 짧은 메모, 밀도 높은 글 |
| `base` *(디폴트)* | 1rem (16px) | 일반 글 |
| `lg` | 1.125rem (18px) | 가독성 강조 |
| `xl` | 1.25rem (20px) | 시, 에세이 |

### 5-3. lineHeight — 줄간격 (문장 내)

키워드 또는 수치 직접 지정 모두 가능.

| 키워드 | 값 | 용도 |
|---|---|---|
| `tight` | 1.4 | 짧은 글, 리스트 |
| `normal` | 1.6 | 뉴스레터, 짧은 에세이 |
| `relaxed` *(디폴트)* | 1.8 | 일반 글 |
| `loose` | 2.2 | 시, 여백 있는 산문 |

```yaml
lineHeight: loose   # 키워드
lineHeight: 2.5     # 수치 직접 지정
```

### 5-4. paragraphSpacing — 단락 간격

키워드 또는 CSS 수치 직접 지정 모두 가능.

| 키워드 | 값 | 용도 |
|---|---|---|
| `tight` | 0.5rem | 촘촘한 글 |
| `normal` *(디폴트)* | 1rem | 일반 글 |
| `relaxed` | 1.5rem | 여유 있는 글 |
| `loose` | 2rem | 시, 단락 구분 강조 |

```yaml
paragraphSpacing: relaxed   # 키워드
paragraphSpacing: 2rem      # CSS 수치 직접 지정
```

---

## 6. 포스팅 페이지 구성

### Hero 영역
- 높이: `min-height: 38vh`
- 배경: frontmatter `image` 지정 시 해당 이미지, 미지정 시 기본 이미지 (커피/노트북 사진)
- 오버레이: `bg-black/65` (65% 어두운 검정)
- 내용: 태그 뱃지 → 제목 (볼드) → 날짜
- 이미지 경로:
  - 로컬: `/images/파일명.jpg` (`public/images/` 폴더)
  - 외부 URL: `https://...` (Unsplash 등)

### 본문 영역
- 최대 너비: `max-w-2xl`
- Typography: frontmatter 설정값 → `<article>` 태그 인라인 스타일로 적용
- 하단: 좋아요 버튼 → 댓글 섹션 (Supabase 연동 시 활성화)

---

## 7. 마크다운 렌더링 지원 기능

| 기능 | 지원 여부 | 비고 |
|---|---|---|
| 기본 마크다운 | ✓ | 제목, 굵게, 기울임, 링크 등 |
| GFM 테이블 | ✓ | `remark-gfm` |
| 단일 줄바꿈 → `<br>` | ✓ | `remark-breaks` |
| LaTeX 수식 | ✓ | `remark-math` + `rehype-katex` |
| HTML 태그 직접 사용 | ✓ | `rehype-raw` (allowDangerousHtml) |

### LaTeX 사용법
```
인라인: $E = mc^2$

블록:
$$
P(A\mid B) = {P(B\mid A)\cdot P(A)\over P(B)}
$$
```

### 테이블 스타일 기본값
- 가운데 정렬, `margin: auto`
- 테두리: 1px solid 연한 회색 (`#e5e7eb`)
- 헤더: 연한 회색 배경 (`#f9fafb`)
- 좌우 외곽선 없음

---

## 8. 이미지 사용

```html
<!-- 로컬 이미지 -->
<img src="/images/flower.jpg" alt="설명" />

<!-- 외부 이미지 -->
<img src="https://..." alt="설명" />
```

> `<img>` 태그는 Next.js Image 최적화를 거치지 않음. 단순 배치 용도로 사용.

---

## 9. 포스팅 예시

### 시 (poetry)
```yaml
---
title: 꽃잎
date: 2023-01-02
tags: [poetry]
language: All
font: nanum-myeongjo
fontSize: xl
lineHeight: loose
paragraphSpacing: relaxed
published: true
---
```

### 에세이 / 독후감
```yaml
---
title: 새뮤얼슨 vs 프리드먼
date: 2025-11-03
tags: [economy, 독후감]
language: All
fontSize: lg
lineHeight: 2.0
published: true
---
```

### 수식 포함 글
```yaml
---
title: 베이즈 정리를 공식없이 이해하기
date: 2025-07-17
tags: [math, 베이즈정리]
language: All
lineHeight: 2.0
published: true
---
```

---

## 10. 기술 구현 위치

| 항목 | 파일 |
|---|---|
| Post 타입 정의 | `src/lib/posts.ts` |
| 마크다운 렌더링 파이프라인 | `src/lib/posts.ts` → `renderMarkdown()` |
| 언어 라우팅 로직 | `src/lib/posts.ts` → `getPostsByLocale()`, `getPost()` |
| Typography 맵 및 적용 | `src/app/[locale]/articles/[slug]/page.tsx` |
| 본문 스타일 (테이블·LaTeX 등) | `src/app/globals.css` → `.prose-article` |
| 폰트 등록 | `src/app/[locale]/layout.tsx` |
| 포스팅 파일 저장 위치 | `content/posts/` |
| 로컬 이미지 저장 위치 | `public/images/` |
