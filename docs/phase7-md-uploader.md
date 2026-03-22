# Phase 7 — MD 업로더 기획서

> 최종 업데이트: 2026-03-22

## 목적

로컬에 저장된 `.md` 파일을 브라우저에서 선택하면, GitHub `content/posts/`에 자동 커밋되어 별도 작업 없이 홈페이지 포스팅이 노출되도록 합니다.

---

## 사용 흐름

```
① 어드민 페이지 접속 (/admin/upload)
② 로그인 체크 (미로그인 시 Google 로그인 유도)
③ 파일 선택 (드래그 앤 드롭 또는 파일 선택 버튼)
④ 파일 내용 미리보기 (frontmatter 파싱 결과 카드)
⑤ 업로드 버튼 클릭
   ├─ GitHub에 동일 파일명 없음 → 바로 커밋
   └─ 동일 파일명 있음 → "덮어쓰기 / 취소" 확인 모달 표시
⑥ 커밋 완료 → Vercel 자동 배포 → 홈페이지 반영
```

---

## 화면 구성

### ① 파일 업로드 영역
- 드래그 앤 드롭 + 파일 선택 버튼 (`.md` 파일만 허용)
- 선택 후 파일명, frontmatter 파싱 결과(title, date, tags 등) 카드 형태로 미리보기

### ② 업로드 버튼
- 동일 파일명 체크 → 없으면 바로 커밋
- 있으면 확인 모달:
  > `"{파일명}" 파일이 이미 존재합니다. 덮어쓰시겠습니까?`
  > `[덮어쓰기] [취소]`

### ③ 결과 표시
- 성공: 커밋 URL 링크 + "배포 중 (보통 1분 내 반영)" 안내
- 실패: 에러 메시지 표시

---

## 기술 구조

```
/src/app/api/upload-post/route.ts     ← GitHub API 호출 (서버사이드)
/src/app/admin/upload/page.tsx         ← 업로드 UI (Client Component)
```

### API Route 흐름
1. `GET /api/upload-post?filename=xxx` → GitHub API로 파일 존재 여부 및 sha 반환
2. `POST /api/upload-post` → `{ filename, content(base64), sha? }` → GitHub `PUT` 커밋
3. 양 엔드포인트 모두 Supabase 세션 + 어드민 이메일 검증

---

## 보안

- GitHub Token은 서버사이드 API route에서만 사용, 클라이언트 미노출
- 어드민 이메일 검증으로 대표님만 접근 가능
- 비로그인 접근 시 로그인 유도 UI 표시

---

## 환경변수

| 변수 | 설명 |
|---|---|
| `GITHUB_TOKEN` | GitHub Personal Access Token (Contents write 권한) |
| `GITHUB_OWNER` | `choi-jaehyung` |
| `GITHUB_REPO` | `home` |
| `ADMIN_EMAIL` | 대표님 Google 계정 이메일 |

---

## 구현 순서

1. `GITHUB_TOKEN` 발급 및 `.env.local` + Vercel 환경변수 등록
2. API Route 구현 (파일 존재 확인 + 커밋)
3. 업로드 UI 구현 (파일 선택, 미리보기, 모달)
4. 접근 제어 구현
5. 로컬 테스트 → Vercel 배포 확인
