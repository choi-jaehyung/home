# 포스팅 Typography 설정 가이드

> 최종 확정: 2026-03-21

---

## 개요

각 포스팅의 MD 파일 헤더(frontmatter)에서 폰트, 폰트 크기, 줄간격을 개별 설정할 수 있다.
설정하지 않으면 디폴트값이 자동 적용된다.

---

## 설정 항목

### `font` — 폰트 계열

| 값 | 적용 폰트 | 특징 |
|----|-----------|------|
| `sans` *(디폴트)* | Geist Sans, system-ui | 깔끔하고 현대적 |
| `serif` | Georgia, Cambria, Times New Roman | 클래식하고 문학적 |
| `mono` | Geist Mono | 코드/기술 글에 적합 |
| `nanum-myeongjo` | 나눔명조 | 한국어 명조체, 문학적 |
| `nanum-gothic` | 나눔고딕 | 한국어 고딕체, 깔끔한 본문 |
| `line-seed` | LINE Seed KR | LINE 산세리프, 모던한 느낌 *(폰트 파일 별도 추가 필요)* |

---

### `fontSize` — 폰트 크기

| 값 | 크기 | 용도 |
|----|------|------|
| `sm` | 14px (0.875rem) | 짧은 메모, 밀도 높은 글 |
| `base` *(디폴트)* | 16px (1rem) | 일반 글 |
| `lg` | 18px (1.125rem) | 가독성 강조 |
| `xl` | 20px (1.25rem) | 시, 에세이 등 여백 있는 글 |

---

### `lineHeight` — 줄간격

| 값 | 비율 | 용도 |
|----|------|------|
| `tight` | 1.4 | 짧은 글, 리스트 |
| `normal` | 1.6 | 뉴스레터, 짧은 에세이 |
| `relaxed` *(디폴트)* | 1.8 | 일반 글 |
| `loose` | 2.2 | 시, 여백 있는 산문 |

---

## 사용 예시

### 시 (poetry)
```yaml
---
title: 꽃잎
date: 2023-01-02
tags: [poetry]
language: Korean
font: serif
fontSize: xl
lineHeight: loose
published: true
---
```

### 기술 글
```yaml
---
title: AI와 일하는 방식
date: 2026-03-21
tags: [science, technology]
language: Korean, English
font: sans
fontSize: base
lineHeight: relaxed
published: true
---
```

### 짧은 메모
```yaml
---
title: 오늘의 단상
date: 2026-03-21
tags: [essay]
language: Korean
font: sans
fontSize: sm
lineHeight: normal
published: true
---
```

---

## 기술 구현

| 항목 | 위치 |
|------|------|
| 타입 정의 | `src/lib/posts.ts` → `Post` 타입의 `font`, `fontSize`, `lineHeight` 필드 |
| 값 매핑 | `src/app/[locale]/articles/[slug]/page.tsx` → `FONT_MAP`, `FONT_SIZE_MAP`, `LINE_HEIGHT_MAP` |
| 적용 방식 | `<article>` 태그의 `style` 속성에 인라인으로 적용 |

---

## 향후 확장 포인트

- **한국어 전용 폰트 추가**: `noto-serif-kr` 등 Google Fonts 추가 가능
  - `next/font/google`에 폰트 추가 → CSS 변수로 등록 → `FONT_MAP`에 키 추가
- **커스텀 폰트 패밀리 직접 지정**: `font: "'Nanum Myeongjo', serif"` 형태 지원 검토 가능
- **헤더/본문 폰트 분리 설정**: `titleFont`, `bodyFont` 키 분리 가능
