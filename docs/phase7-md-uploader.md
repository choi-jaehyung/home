# Phase 7 — MD 업로더 기획서

> 최종 업데이트: 2026-03-23 (구현 완료)

## 목적

로컬에 저장된 `.md` 파일을 브라우저에서 선택하면, GitHub `content/posts/`에 자동 커밋되어 별도 작업 없이 홈페이지 포스팅이 노출되도록 합니다.

---

## 접속 방법

- URL: `https://roarion.me/ko/admin/upload`
- Articles 페이지 "Writings" 타이틀 옆 "Admin" 링크로도 접근 가능
- 어드민 이메일(`writer.jaehyung@gmail.com`) Google 계정으로만 접근 가능

---

## 사용 흐름

```
① 어드민 페이지 접속 (/ko/admin/upload)
② 로그인 체크
   ├─ 미로그인 → "Google로 로그인" 버튼 표시
   └─ 로그인됨 → 어드민 이메일 검증
       ├─ 어드민 아님 → "접근 권한이 없습니다" + 로그아웃 버튼
       └─ 어드민 확인 → 업로더 화면 표시
③ .md 파일 선택 (드래그 앤 드롭 또는 클릭)
④ frontmatter 미리보기 (title, date, tags 등 카드로 표시)
⑤ 업로드 버튼 클릭
   ├─ GitHub에 동일 파일명 없음 → 바로 커밋
   └─ 동일 파일명 있음 → "덮어쓰기 / 취소" 확인 모달
⑥ 커밋 완료 → Vercel 자동 배포 → 홈페이지 반영 (약 1분)
```

---

## 파일 구조

```
src/app/api/upload-post/route.ts          ← GitHub API 호출 (서버사이드)
src/app/[locale]/admin/upload/page.tsx    ← 업로드 UI (Client Component)
src/app/api/debug-auth/route.ts           ← 인증 디버그 엔드포인트 (임시, 추후 삭제 예정)
src/components/AuthRedirect.tsx           ← OAuth 후 어드민 페이지로 복귀 처리
```

---

## API Route 흐름

1. `GET /api/upload-post?filename=xxx`
   - Supabase Bearer 토큰으로 어드민 검증
   - GitHub API로 파일 존재 여부 및 sha 반환
   - 응답: `{ exists: false }` 또는 `{ exists: true, sha: "..." }`

2. `POST /api/upload-post` — `{ filename, content(base64), sha? }`
   - 어드민 검증
   - GitHub `PUT /repos/{owner}/{repo}/contents/{path}` 커밋
   - `sha` 포함 시 기존 파일 덮어쓰기

3. **어드민 검증 (isAdmin 판정)**
   - 클라이언트가 `Authorization: Bearer {access_token}` 헤더로 전달
   - 서버에서 `@supabase/supabase-js createClient`로 `getUser(token)` 호출
   - 반환된 user.email과 `ADMIN_EMAIL` 환경변수 비교

---

## OAuth 리다이렉트 처리

Supabase Google OAuth의 PKCE 코드가 홈페이지(`/ko?code=xxx`)로 랜딩됨 (Next.js next-intl 라우팅 구조 상). `/auth/callback`으로 리다이렉트되지 않는 문제를 `AuthRedirect` 컴포넌트로 해결.

- 로그인 버튼 클릭 시 `localStorage.setItem("authReturn", "/ko/admin/upload")`
- `AuthRedirect` 컴포넌트가 레이아웃에 포함되어 페이지 로드마다 실행
- 로그인된 유저 감지 + `authReturn` 값 있으면 해당 경로로 자동 이동

---

## 한글 파일명 처리

macOS는 파일명을 NFD 유니코드로 전송, GitHub은 NFC로 저장. 미처리 시 동일 파일이 중복 생성됨.

```typescript
function normalizeFilename(filename: string) {
  return filename.normalize("NFC");
}
```

---

## 보안

- GitHub Token은 서버사이드 API route에서만 사용, 클라이언트 미노출
- 어드민 이메일 검증으로 지정된 계정만 접근 가능
- Supabase JWT Bearer 토큰으로 서버사이드 사용자 검증

---

## 환경변수 (Vercel `home` 프로젝트 Production)

| 변수 | 값 | 설명 |
|------|-----|------|
| `ADMIN_EMAIL` | `writer.jaehyung@gmail.com` | 어드민 Google 계정 |
| `GITHUB_TOKEN` | `github_pat_...` | GitHub PAT (Contents 읽기/쓰기) |
| `GITHUB_OWNER` | `choi-jaehyung` | GitHub 계정명 |
| `GITHUB_REPO` | `home` | GitHub 저장소명 |

> ⚠️ 환경변수는 **`home`** 프로젝트에 설정해야 함. `homepage` 프로젝트(사용 안 함)가 아님.

---

## 정리 필요 사항

- [ ] `src/app/api/debug-auth/route.ts` 삭제 (임시 디버그용, 보안상 제거 권장)
- [ ] `src/app/[locale]/admin/upload/page.tsx` 내 debug 관련 state/코드 제거
