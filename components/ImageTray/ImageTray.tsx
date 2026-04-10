"use client";

import { useState } from "react";
import { Star, Trash2, ChevronUp, ImageOff } from "lucide-react";

export interface ImageEntry {
  fileId: string;
  url: string;
  altText: string;
}

interface ImageTrayProps {
  images: ImageEntry[];
  heroFileId: string | null;
  onHeroChange: (fileId: string | null) => void;
  onRemove: (fileId: string) => void;
  onScrollToImage: (fileId: string) => void;
}

export function ImageTray({
  images,
  heroFileId,
  onHeroChange,
  onRemove,
  onScrollToImage,
}: ImageTrayProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-gray-100 shrink-0">
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Images (${images.length})`}
        aria-expanded={open}
        className="flex items-center gap-2 w-full px-12 py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        <ChevronUp
          size={14}
          className={`transition-transform ${open ? "" : "rotate-180"}`}
        />
        Images ({images.length})
      </button>

      {/* Tray content */}
      {open && (
        <div className="px-12 pb-4">
          {images.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
              <ImageOff size={14} />
              No images in this post yet.
            </div>
          ) : (
            <div className="flex items-start gap-3 flex-wrap">
              {images.map((img) => {
                const isHero = img.fileId === heroFileId;
                return (
                  <div
                    key={img.fileId}
                    data-testid={`image-thumb-${img.fileId}`}
                    onClick={() => onScrollToImage(img.fileId)}
                    className={`
                      relative group w-20 h-20 rounded-lg overflow-hidden border-2 cursor-pointer transition-colors
                      ${isHero ? "border-[#ff7d00]" : "border-gray-200 hover:border-gray-300"}
                    `}
                  >
                    {/* Thumbnail */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.altText || "Post image"}
                      className="w-full h-full object-cover"
                    />

                    {/* Overlay controls (visible on hover) */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                      {/* Hero / star button */}
                      <button
                        type="button"
                        data-testid={`hero-btn-${img.fileId}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onHeroChange(isHero ? null : img.fileId);
                        }}
                        aria-label={isHero ? "Remove as hero image" : "Set as hero image"}
                        className={`p-1 rounded-full transition-colors ${
                          isHero
                            ? "bg-[#ff7d00] text-white"
                            : "bg-white/20 text-white hover:bg-[#ff7d00]"
                        }`}
                      >
                        <Star size={12} fill={isHero ? "currentColor" : "none"} />
                      </button>

                      {/* Remove button */}
                      <button
                        type="button"
                        data-testid={`remove-btn-${img.fileId}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemove(img.fileId);
                        }}
                        aria-label="Remove image"
                        className="p-1 rounded-full bg-white/20 text-white hover:bg-red-500 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    {/* Hero badge */}
                    {isHero && (
                      <div className="absolute top-1 left-1 bg-[#ff7d00] rounded-full p-0.5">
                        <Star size={8} fill="white" className="text-white" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
