"use client";

import React, { ReactNode } from "react";

export interface EmptyResultProps {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  imageClassName?: string;
  mediaType?: "video" | "image";
  mediaSrc?: string;
}

export function EmptyResult({
  title = "No appointments scheduled today",
  description = "Appointments booked via your branded booking page will appear here automatically.",
  action,
  className = "",
  imageClassName = "w-28 h-28 sm:w-32 sm:h-32",
  mediaType = "video",
  mediaSrc,
}: EmptyResultProps) {
  const isVideo = mediaType === "video" || (mediaSrc && mediaSrc.endsWith(".webm"));
  const defaultSrc = isVideo ? "/animations/noresult.webm" : "/animations/emptyfiles.svg";
  const source = mediaSrc || defaultSrc;

  return (
    <div className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center select-none ${className}`}>
      {isVideo ? (
        <video
          src={source}
          autoPlay
          loop
          muted
          playsInline
          className={`${imageClassName} mx-auto object-contain pointer-events-none mb-3`}
        />
      ) : (
        <img
          src={source}
          alt="No results"
          className={`${imageClassName} mx-auto object-contain pointer-events-none mb-3`}
        />
      )}
      {title && (
        <h3 className="text-base sm:text-lg font-light text-[#105F68] tracking-tight">
          {title}
        </h3>
      )}
      {description && (
        <p className="text-xs sm:text-sm text-[#3A9295] max-w-sm sm:max-w-md mx-auto mt-1 leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export default EmptyResult;
