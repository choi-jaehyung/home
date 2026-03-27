"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";

type Frontmatter = Record<string, string>;
type UploadedImage = { filename: string; url: string; markdownSnippet: string };

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

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function UploadPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"md" | "image">("md");

  // ── MD 업로더 상태 ──
  const [file, setFile] = useState<File | null>(null);
  const [fileText, setFileText] = useState<string>("");
  const [frontmatter, setFrontmatter] = useState<Frontmatter>({});
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; url?: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [existingSha, setExistingSha] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── 이미지 업로더 상태 ──
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageDragging, setImageDragging] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageResult, setImageResult] = useState<{ success: boolean; message: string; url?: string; markdownSnippet?: string } | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageSha, setImageSha] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

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
        setIsAdmin(res.status === 400);
      }
      setAuthLoading(false);
    });
  }, []);

  // ── MD 업로더 핸들러 ──

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

  // ── 이미지 업로더 핸들러 ──

  function handleImageSelect(selected: File | null) {
    if (!selected) return;
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(selected.type)) {
      alert("jpg, png, gif, webp 파일만 업로드 가능합니다.");
      return;
    }
    setImageFile(selected);
    setImageResult(null);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(selected);
  }

  function handleImageDrop(e: React.DragEvent) {
    e.preventDefault();
    setImageDragging(false);
    handleImageSelect(e.dataTransfer.files[0] ?? null);
  }

  async function handleImageUpload(sha?: string) {
    if (!imageFile) return;
    setImageUploading(true);
    setImageResult(null);

    try {
      if (sha === undefined) {
        const checkRes = await fetch(
          `/api/upload-image?filename=${encodeURIComponent(imageFile.name)}`,
          { headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {} }
        );
        if (checkRes.status === 401) {
          setImageResult({ success: false, message: "접근 권한이 없습니다." });
          setImageUploading(false);
          return;
        }
        const checkData = await checkRes.json();
        if (checkData.exists) {
          setImageSha(checkData.sha);
          setShowImageModal(true);
          setImageUploading(false);
          return;
        }
      }

      const base64 = await fileToBase64(imageFile);

      const res = await fetch("/api/upload-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          filename: imageFile.name,
          content: base64,
          sha: sha ?? undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setImageResult({
          success: true,
          message: "업로드 완료! Vercel 배포 후 (~1분) 사용 가능합니다.",
          url: data.url,
          markdownSnippet: data.markdownSnippet,
        });
        setUploadedImages((prev) => [
          { filename: imageFile.name, url: data.url, markdownSnippet: data.markdownSnippet },
          ...prev,
        ]);
        setImageFile(null);
        setImagePreview(null);
      } else {
        setImageResult({ success: false, message: data.error || "업로드 실패" });
      }
    } catch {
      setImageResult({ success: false, message: "네트워크 오류가 발생했습니다." });
    } finally {
      setImageUploading(false);
    }
  }

  function handleImageOverwrite() {
    setShowImageModal(false);
    handleImageUpload(imageSha ?? undefined);
  }

  async function copyToClipboard(text: string, index: number) {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  async function handleGoogleLogin() {
    if (!supabase) return;
    localStorage.setItem("authReturn", window.location.pathname);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  // ── 렌더 ──

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100 text-center max-w-sm w-full">
          <p className="text-lg font-semibold text-gray-900 mb-2">접근 권한이 없습니다</p>
          <p className="text-sm text-gray-400 mb-6">{userEmail}</p>
          <button
            onClick={async () => { await supabase?.auth.signOut(); setUserEmail(null); setIsAdmin(false); }}
            className="w-full py-2.5 px-4 border border-gray-200 text-sm text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
          >
            로그아웃
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Admin 업로더</h1>
        <p className="text-sm text-gray-400 mb-6">GitHub에 파일을 직접 커밋합니다.</p>

        {/* 탭 */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-8">
          <button
            onClick={() => setActiveTab("md")}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === "md" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            MD 업로더
          </button>
          <button
            onClick={() => setActiveTab("image")}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === "image" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            이미지 업로더
          </button>
        </div>

        {/* ── MD 업로더 탭 ── */}
        {activeTab === "md" && (
          <>
            <p className="text-xs text-gray-400 mb-4">
              .md 파일을 선택하면 GitHub <code className="bg-gray-100 px-1 rounded">content/posts/</code>에 자동 커밋됩니다.
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
                  <p className="text-sm text-gray-500">클릭하거나 .md 파일을 드래그하세요</p>
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
          </>
        )}

        {/* ── 이미지 업로더 탭 ── */}
        {activeTab === "image" && (
          <>
            <p className="text-xs text-gray-400 mb-4">
              이미지를 선택하면 GitHub <code className="bg-gray-100 px-1 rounded">public/images/</code>에 자동 커밋됩니다.
            </p>

            {/* 드롭 영역 */}
            <div
              className={`relative border-2 border-dashed rounded-2xl overflow-hidden text-center cursor-pointer transition-colors ${
                imageDragging
                  ? "border-black bg-gray-100"
                  : "border-gray-200 bg-white hover:border-gray-400"
              }`}
              style={{ minHeight: "160px" }}
              onDragOver={(e) => { e.preventDefault(); setImageDragging(true); }}
              onDragLeave={() => setImageDragging(false)}
              onDrop={handleImageDrop}
              onClick={() => imageInputRef.current?.click()}
            >
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={(e) => handleImageSelect(e.target.files?.[0] ?? null)}
              />
              {imagePreview ? (
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="미리보기"
                    className="w-full max-h-64 object-contain"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-black/40 px-3 py-2 text-left">
                    <p className="text-xs text-white font-medium truncate">{imageFile?.name}</p>
                    <p className="text-xs text-white/70">{imageFile ? (imageFile.size / 1024).toFixed(1) + " KB" : ""}</p>
                  </div>
                </div>
              ) : (
                <div className="py-10 px-4">
                  <svg className="w-8 h-8 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                  <p className="text-sm text-gray-500">클릭하거나 이미지를 드래그하세요</p>
                  <p className="text-xs text-gray-400 mt-1">jpg, png, gif, webp</p>
                </div>
              )}
            </div>

            {/* 업로드 버튼 */}
            {imageFile && (
              <button
                onClick={() => handleImageUpload()}
                disabled={imageUploading}
                className="mt-4 w-full py-3 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {imageUploading ? "업로드 중..." : "업로드"}
              </button>
            )}

            {/* 결과 */}
            {imageResult && (
              <div
                className={`mt-4 rounded-2xl p-4 text-sm ${
                  imageResult.success
                    ? "bg-green-50 text-green-800 border border-green-100"
                    : "bg-red-50 text-red-800 border border-red-100"
                }`}
              >
                <p>{imageResult.message}</p>
                {imageResult.url && (
                  <p className="mt-1 text-xs font-mono break-all opacity-80">{imageResult.url}</p>
                )}
              </div>
            )}

            {/* 업로드된 이미지 목록 */}
            {uploadedImages.length > 0 && (
              <div className="mt-6">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">이번 세션 업로드</p>
                <div className="space-y-2">
                  {uploadedImages.map((img, idx) => (
                    <div key={idx} className="bg-white rounded-xl p-3 border border-gray-100 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-700 truncate">{img.filename}</p>
                        <p className="text-xs text-gray-400 font-mono truncate">{img.url}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(img.markdownSnippet, idx)}
                        className="flex-shrink-0 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600"
                      >
                        {copiedIndex === idx ? "복사됨!" : "MD 복사"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <p className="mt-6 text-xs text-gray-300 text-center">{userEmail}</p>
      </div>

      {/* MD 덮어쓰기 모달 */}
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

      {/* 이미지 덮어쓰기 모달 */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <p className="text-sm font-semibold text-gray-900 mb-1">이미지가 이미 존재합니다</p>
            <p className="text-sm text-gray-500 mb-5">
              <span className="font-medium text-gray-700">{imageFile?.name}</span> 파일이 GitHub에 이미
              있습니다. 덮어쓰시겠습니까?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowImageModal(false)}
                className="flex-1 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleImageOverwrite}
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
