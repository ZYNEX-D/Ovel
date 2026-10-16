"use client";

import { useEffect } from "react";

const GOOGLE_FONT_QUERY: Record<string, string> = {
  Inter: "family=Inter:wght@400;600;700",
  Outfit: "family=Outfit:wght@400;600;700",
  "Playfair Display": "family=Playfair+Display:wght@400;600",
  "Space Grotesk": "family=Space+Grotesk:wght@400;600;700",
  Syne: "family=Syne:wght@400;700",
};

export default function ThemeFontLoader({ family }: { family: string }) {
  useEffect(() => {
    const query = GOOGLE_FONT_QUERY[family];
    if (!query) return;
    const id = `ovel-font-${family.toLowerCase().replace(/\s+/g, "-")}`;
    if (document.getElementById(id)) return;

    if (!document.getElementById("ovel-font-preconnect")) {
      const preconnect = document.createElement("link");
      preconnect.id = "ovel-font-preconnect";
      preconnect.rel = "preconnect";
      preconnect.href = "https://fonts.googleapis.com";
      document.head.appendChild(preconnect);
      const files = document.createElement("link");
      files.rel = "preconnect";
      files.href = "https://fonts.gstatic.com";
      files.crossOrigin = "anonymous";
      document.head.appendChild(files);
    }

    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?${query}&display=swap`;
    document.head.appendChild(link);
  }, [family]);

  return null;
}
