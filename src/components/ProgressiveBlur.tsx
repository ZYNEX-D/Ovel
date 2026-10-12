import React from "react";

interface ProgressiveBlurProps {
  position?: "top" | "bottom";
  height?: string;
  className?: string;
}

export default function ProgressiveBlur({
  position = "top",
  height = "h-28",
  className = "",
}: ProgressiveBlurProps) {
  const isTop = position === "top";

  return (
    <div
      className={`pointer-events-none fixed left-0 right-0 z-30 ${
        isTop ? "top-0" : "bottom-0"
      } ${height} ${className}`}
      aria-hidden="true"
    >
      {/* Multi-layered progressive blur gradient */}
      <div
        className="absolute inset-0"
        style={{
          backdropFilter: "blur(1px)",
          WebkitBackdropFilter: "blur(1px)",
          maskImage: isTop
            ? "linear-gradient(to top, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 12.5%)"
            : "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 12.5%)",
          WebkitMaskImage: isTop
            ? "linear-gradient(to top, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 12.5%)"
            : "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 12.5%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          maskImage: isTop
            ? "linear-gradient(to top, rgba(0,0,0,0) 12.5%, rgba(0,0,0,1) 37.5%)"
            : "linear-gradient(to bottom, rgba(0,0,0,0) 12.5%, rgba(0,0,0,1) 37.5%)",
          WebkitMaskImage: isTop
            ? "linear-gradient(to top, rgba(0,0,0,0) 12.5%, rgba(0,0,0,1) 37.5%)"
            : "linear-gradient(to bottom, rgba(0,0,0,0) 12.5%, rgba(0,0,0,1) 37.5%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          maskImage: isTop
            ? "linear-gradient(to top, rgba(0,0,0,0) 37.5%, rgba(0,0,0,1) 65%)"
            : "linear-gradient(to bottom, rgba(0,0,0,0) 37.5%, rgba(0,0,0,1) 65%)",
          WebkitMaskImage: isTop
            ? "linear-gradient(to top, rgba(0,0,0,0) 37.5%, rgba(0,0,0,1) 65%)"
            : "linear-gradient(to bottom, rgba(0,0,0,0) 37.5%, rgba(0,0,0,1) 65%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          maskImage: isTop
            ? "linear-gradient(to top, rgba(0,0,0,0) 65%, rgba(0,0,0,1) 100%)"
            : "linear-gradient(to bottom, rgba(0,0,0,0) 65%, rgba(0,0,0,1) 100%)",
          WebkitMaskImage: isTop
            ? "linear-gradient(to top, rgba(0,0,0,0) 65%, rgba(0,0,0,1) 100%)"
            : "linear-gradient(to bottom, rgba(0,0,0,0) 65%, rgba(0,0,0,1) 100%)",
        }}
      />
      {/* Subtle tint gradient matching Ovel background */}
      <div
        className={`absolute inset-0 ${
          isTop
            ? "bg-gradient-to-b from-[#F6FAF9]/80 via-[#F6FAF9]/40 to-transparent"
            : "bg-gradient-to-t from-[#F6FAF9]/80 via-[#F6FAF9]/40 to-transparent"
        }`}
      />
    </div>
  );
}
