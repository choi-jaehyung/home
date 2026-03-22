"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";

type Frontmatter = Record<string, string>;

function parseFrontmatter(text: string): Frontmatter {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const result: Frontmatter = {};
  for (const line of match[1].split(/\r?\n/)) {
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    result[line.slice(0, colon).trim()] = line.slice(colon + 1).trim();
  }
  return result;
}

function toBase64(text: string): string {
  return btoa(unescape(encodeURIComponent(text)));
}

export default function UploadPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown> | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [fileText, setFileText] = useState<string>("");
  const [frontmatter, setFrontmatter] = useState<Frontmatter>({});

  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; url?: string } | null>(null);

  // 덮어쓰기 모달
  const [showModal, setShowModal] = useState(false);
  const [existingSha, setExistingSha] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // 세션 확인 + 어드민 검증
  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const email = session?.user?.email ?? null;
      const token = session?.access_token ?? null;
      setUserEmail(email);
      setAccessToken(token);
      if (email && token) {
        const res = await fetch("/api/upload-post", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const adminOk = res.status === 400;
        setIsAdmin(adminOk);
        if (!adminOk) {
          // 인증 실패 시 디버그 정보 수집
          fetch("/api/debug-auth", {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((r) => r.json())
            .then(setDebugInfo)
            .catch(() => {});
        }
      }
      setAuthLoading(false);
    });
  }, []);

  function handleFileSelect(selected: File | null) {
    if (!selected) return;
    if (!selected.name.endsWith(".md")) {
      alert(".md 파일만 업로드 가능합니다.");
      return;
    }
    setFile(selected);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setFileText(text);
      setFrontmatter(parseFrontmatter(text));
    };
    reader.readAsText(selected, "utf-8");
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleFileSelect(e.dataTransfer.files[0] ?? null);
  }

  async function handleUpload(sha?: string) {
    if (!file || !fileText) return;
    setUploading(true);
    setResult(null);

    try {
      // 1. 파일 존재 확인 (sha 이미 알고 있으면 스킵)
      if (sha === undefined) {
        const checkRes = await fetch(
          `/api/upload-post?filename=${encodeURIComponent(file.name)}`,
          { headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {} }
        );
        if (checkRes.status === 401) {
          setResult({ success: false, message: "접근 권한이 없습니다." });
          setUploading(false);
          return;
        }
        const checkData = await checkRes.json();
        if (checkData.exists) {
          setExistingSha(checkData.sha);
          setShowModal(true);
          setUploading(false);
          return;
        }
      }

      // 2. 커밋
      const res = await fetch("/api/upload-post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          filename: file.name,
          content: toBase64(fileText),
          sha: sha ?? undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResult({
          success: true,
          message: "업로드 완료! Vercel 자동 배포가 시작됩니다 (보통 1분 내 반영).",
          url: data.commitUrl,
        });
        setFile(null);
        setFileText("");
        setFrontmatter({});
      } else {
        setResult({ success: false, message: data.error || "업로드 실패" });
      }
    } catch {
      setResult({ success: false, message: "네트워크 오류가 발생했습니다." });
    } finally {
      setUploading(false);
    }
  }

  function handleOverwrite() {
    setShowModal(false);
    handleUpload(existingSha ?? undefined);
  }

  async function handleGoogleLogin() {
    if (!supabase) return;
    localStorage.setItem("authReturn", window.location.pathname);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  // ── 렌더 ────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-sm">로딩 중...</p>
      </div>
    );
  }

  if (!userEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100 text-center max-w-sm w-full">
          <p className="text-lg font-semibold text-gray-900 mb-2">로그인이 필요합니다</p>
          <p className="text-sm text-gray-400 mb-6">어드민 계정으로 로그인해 주세요.</p>
          <button
            onClick={handleGoogleLogin}
            className="w-full py-2.5 px-4 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
          >
            Google로 로그인
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100 text-center max-w-lg w-full">
          <p className="text-lg font-semibold text-gray-900 mb-2">접근 권한이 없습니다</p>
          <p className="text-sm text-gray-400 mb-6">{userEmail}</p>
          <button
            onClick={async () => { await supabase?.auth.signOut(); setUserEmail(null); setIsAdmin(false); }}
            className="w-full py-2.5 px-4 border border-gray-200 text-sm text-gray-600 rounded-xl hover:bg-gray-50 transition-colors mb-4"
          >
            로그아웃
          </button>
          {debugInfo && (
            <details className="text-left mt-2">
              <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">Debug Info</summary>
              <pre className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-xl p-3 overflow-auto max-h-64 whitespace-pre-wrap break-all">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">MD 업로더</h1>
        <p className="text-sm text-gray-400 mb-8">
          로컬 .md 파일을 선택하면 GitHub에 자동으로 커밋됩니다.
        </p>

        {/* 드롭 영역 */}
        <div
          className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${
            dragging
              ? "border-black bg-gray-100"
              : "border-gray-200 bg-white hover:border-gray-400"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".md"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <div onClick={(e) => e.stopPropagation()}>
              <p className="text-sm font-medium text-gray-700 mb-1">{file.name}</p>
              <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <>
              <svg className="w-8 h-8 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <p className="text-sm text-gray-500">
                클릭하거나 .md 파일을 드래그하세요
              </p>
            </>
          )}
        </div>

        {/* Frontmatter 미리보기 */}
        {file && Object.keys(frontmatter).length > 0 && (
          <div className="mt-4 bg-white rounded-2xl p-5 border border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">미리보기</p>
            <dl className="space-y-2">
              {["title", "date", "tags", "description", "published", "language"].map((key) =>
                frontmatter[key] ? (
                  <div key={key} className="flex gap-3 text-sm">
                    <dt className="text-gray-400 w-24 flex-shrink-0">{key}</dt>
                    <dd className="text-gray-800 break-all">{frontmatter[key]}</dd>
                  </div>
                ) : null
              )}
            </dl>
          </div>
        )}

        {/* 업로드 버튼 */}
        {file && (
          <button
            onClick={() => handleUpload()}
            disabled={uploading}
            className="mt-4 w-full py-3 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? "업로드 중..." : "업로드"}
          </button>
        )}

        {/* 결과 */}
        {result && (
          <div
            className={`mt-4 rounded-2xl p-4 text-sm ${
              result.success
                ? "bg-green-50 text-green-800 border border-green-100"
                : "bg-red-50 text-red-800 border border-red-100"
            }`}
          >
            <p>{result.message}</p>
            {result.url && (
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 block text-xs underline opacity-70 hover:opacity-100"
              >
                커밋 확인 →
              </a>
            )}
          </div>
        )}

        <p className="mt-6 text-xs text-gray-300 text-center">{userEmail}</p>
      </div>

      {/* 덮어쓰기 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <p className="text-sm font-semibold text-gray-900 mb-1">파일이 이미 존재합니다</p>
            <p className="text-sm text-gray-500 mb-5">
              <span className="font-medium text-gray-700">{file?.name}</span> 파일이 GitHub에 이미
              있습니다. 덮어쓰시겠습니까?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleOverwrite}
                className="flex-1 py-2 text-sm text-white bg-black rounded-xl hover:bg-gray-800 transition-colors"
              >
                덮어쓰기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
