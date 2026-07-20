"use client";

import { useState } from "react";

export function ProductGallery({
  images,
  name,
}: {
  images: { path: string; alt: string | null }[];
  name: string;
}) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="grid aspect-square w-full place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-6xl text-neutral-700">
        ◻
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
        {images.map((image, index) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={image.path}
            src={`/uploads/${image.path}`}
            alt={image.alt ?? name}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
              index === active ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={image.path}
              type="button"
              aria-label={`Ver imagen ${index + 1}`}
              onClick={() => setActive(index)}
              className={`press h-16 w-16 shrink-0 overflow-hidden rounded-xl border transition-colors duration-150 ${
                index === active
                  ? "border-white"
                  : "border-white/10 hover:border-white/40"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/uploads/${image.path}`}
                alt=""
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
