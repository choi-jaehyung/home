"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import Image from "next/image";

type Photo = {
  id: string;
  url: string;
  caption: string | null;
  taken_at: string | null;
  created_at: string;
};

export default function AdminPhotosPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);

  // 업로드 폼
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [takenAt, setTakenAt] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // 삭제
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

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
        if (adminOk) fetchPhotos();
      }
      setAuthLoading(false);
    });
  }, []);

  async function fetchPhotos() {
    if (!supabase) return;
    setLoadingPhotos(true);
    const { data } = await supabase
      .from("photos")
      .select("*")
      .order("taken_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
    setPhotos((data as Photo[]) || []);
    setLoadingPhotos(false);
  }

  function handleFileSelect(selected: File | null) {
    if (!selected) return;
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(selected.type)) {
      alert("jpg, png, gif, webp 파일만 업로드 가능합니다.");
      return;
    }
    setImageFile(selected);
    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(selected);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleFileSelect(e.dataTransfer.files[0] ?? null);
  }

  async function handleUpload() {
    if (!imageFile) return;
    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", imageFile);
      if (caption.trim()) formData.append("caption", caption.trim());
      if (takenAt) formData.append("taken_at", takenAt);

      const res = await fetch("/api/photos", {
        method: "POST",
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || "업로드 실패");
        return;
      }

      setImageFile(null);
      setImagePreview(null);
      setCaption("");
      setTakenAt("");
      await fetchPhotos();
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "업로드 실패");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(photo: Photo) {
    if (!confirm(`"${photo.caption || photo.id}" 사진을 삭제하시겠습니까?`)) return;
    setDeletingId(photo.id);

    try {
      await fetch("/api/photos", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ id: photo.id, url: photo.url }),
      });
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "삭제 실패");
    } finally {
      setDeletingId(null);
    }
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
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">사진 관리</h1>
        <p className="text-sm text-gray-400 mb-8">Supabase Storage에 사진을 업로드합니다.</p>

        {/* 업로드 폼 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">새 사진 추가</p>

          {/* 드롭 영역 */}
          <div
            className={`relative border-2 border-dashed rounded-xl overflow-hidden text-center cursor-pointer transition-colors mb-4 ${
              dragging ? "border-black bg-gray-100" : "border-gray-200 bg-gray-50 hover:border-gray-400"
            }`}
            style={{ minHeight: "140px" }}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
            />
            {imagePreview ? (
              <div onClick={(e) => e.stopPropagation()}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="미리보기"
                  className="w-full max-h-56 object-contain"
                />
              </div>
            ) : (
              <div className="py-10">
                <svg className="w-7 h-7 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                <p className="text-sm text-gray-400">클릭하거나 이미지를 드래그하세요</p>
              </div>
            )}
          </div>

          {/* 메타데이터 입력 */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">캡션 (선택)</label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="사진 설명을 입력하세요"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">촬영일 (선택)</label>
              <input
                type="date"
                value={takenAt}
                onChange={(e) => setTakenAt(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>
          </div>

          {uploadError && (
            <p className="mt-3 text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">{uploadError}</p>
          )}

          <button
            onClick={handleUpload}
            disabled={!imageFile || uploading}
            className="mt-4 w-full py-2.5 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? "업로드 중..." : "업로드"}
          </button>
        </div>

        {/* 사진 목록 */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
            업로드된 사진 ({photos.length}장)
          </p>

          {loadingPhotos ? (
            <p className="text-sm text-gray-400">로딩 중...</p>
          ) : photos.length === 0 ? (
            <p className="text-sm text-gray-400">업로드된 사진이 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {photos.map((photo) => (
                <div key={photo.id} className="bg-white rounded-xl border border-gray-100 flex items-center gap-4 p-3">
                  <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 relative">
                    <Image
                      src={photo.url}
                      alt={photo.caption || ""}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    {photo.caption ? (
                      <p className="text-sm font-medium text-gray-800 truncate">{photo.caption}</p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">캡션 없음</p>
                    )}
                    {photo.taken_at && (
                      <p className="text-xs text-gray-400 mt-0.5">{photo.taken_at}</p>
                    )}
                    <p className="text-xs text-gray-300 mt-0.5 truncate">{photo.url.split("/").pop()}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(photo)}
                    disabled={deletingId === photo.id}
                    className="flex-shrink-0 px-3 py-1.5 text-xs text-red-500 border border-red-100 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                  >
                    {deletingId === photo.id ? "삭제 중..." : "삭제"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="mt-8 text-xs text-gray-300 text-center">{userEmail}</p>
      </div>
    </div>
  );
}
