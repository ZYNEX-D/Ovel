"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getOvelink, OvelinkCustomization } from "@/lib/ovelink-store";
import OvelinkView from "@/components/OvelinkView";

export default function PublicBookingPage() {
  const params = useParams();
  const slug = (params?.slug as string) || "leclat";
  const [config, setConfig] = useState<OvelinkCustomization | null>(null);

  useEffect(() => {
    setConfig(getOvelink(slug));
  }, [slug]);

  if (!config) {
    return (
      <div className="min-h-screen bg-[#F6FAF9] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#105F68] border-t-transparent animate-spin" />
      </div>
    );
  }

  return <OvelinkView config={config} />;
}
