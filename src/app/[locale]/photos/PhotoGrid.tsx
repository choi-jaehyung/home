"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

type Photo = {
  id: string;
  url: string;
  caption: string | null;
  taken_at: string | null;
};

export default function PhotoGrid({ photos }: { photos: Photo[] }) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const close = useCallback(() => setSelectedIdx(null), []);
  const prev = useCallback(() => setSelectedIdx((i) => (i !== null ? (i - 1 + photos.length) % photos.length : null)), [photos.length]);
  const next = useCallback(() => setSelectedIdx((i) => (i !== null ? (i + 1) % photos.length : null)), [photos.length]);

  useEffect(() => {
    if (selectedIdx === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedIdx, close, prev, next]);

  const selected = selectedIdx !== null ? photos[selectedIdx] : null;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {photos.map((photo, idx) => (
          <div
            key={photo.id}
            className="cursor-pointer"
            onClick={() => setSelectedIdx(idx)}
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-100 group">
              <Image
                src={photo.url}
                alt={photo.caption || ""}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
            </div>
            {(photo.caption || photo.taken_at) && (
              <div className="mt-1.5 px-0.5">
                {photo.caption && (
                  <p className="text-sm text-gray-700 leading-snug">{photo.caption}</p>
                )}
                {photo.taken_at && (
                  <p className="text-xs text-gray-400 mt-0.5">{photo.taken_at}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {selected && selectedIdx !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={close}
        >
          {/* 닫기 */}
          <button
            className="absolute top-4 right-4 text-white p-2 rounded-full hover:bg-white/20 transition-colors"
            onClick={close}
            aria-label="닫기"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* 이전 */}
          <button
            className="absolute left-4 text-white p-2 rounded-full hover:bg-white/20 transition-colors"
            onClick={(e) => { e.stopPropagation(); prev(); }}
            aria-label="이전 사진"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* 다음 */}
          <button
            className="absolute right-4 text-white p-2 rounded-full hover:bg-white/20 transition-colors"
            onClick={(e) => { e.stopPropagation(); next(); }}
            aria-label="다음 사진"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* 이미지 */}
          <div
            className="flex flex-col items-center max-w-[80vw] max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selected.url}
              alt={selected.caption || ""}
              className="max-w-[80vw] max-h-[78vh] object-contain rounded-lg"
            />
            {(selected.caption || selected.taken_at) && (
              <div className="mt-4 text-center">
                {selected.caption && (
                  <p className="text-white text-sm font-medium">{selected.caption}</p>
                )}
                {selected.taken_at && (
                  <p className="text-white/60 text-xs mt-1">{selected.taken_at}</p>
                )}
              </div>
            )}
            <p className="text-white/40 text-xs mt-2">{selectedIdx + 1} / {photos.length}</p>
          </div>
        </div>
      )}
    </>
  );
}
