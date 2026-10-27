"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getOvelink, getSlugRedirect, sanitizeSlug, OvelinkCustomization } from "@/lib/ovelink-store";
import { STORE_EVENT } from "@/lib/store-events";
import OvelinkView from "@/components/OvelinkView";

export default function DynamicOvelinkPage() {
  const params = useParams();
  const router = useRouter();
  const rawSlug = (params?.slug as string) || "leclat";
  const cleanSlug = sanitizeSlug(rawSlug) || "leclat";
  const [config, setConfig] = useState<OvelinkCustomization | null>(null);

  useEffect(() => {
    // Check if this slug was redirected to a newer URL handle
    const redirect = getSlugRedirect(cleanSlug);
    if (redirect && redirect !== cleanSlug) {
      router.replace(`/l/${redirect}`);
      return;
    }

    const load = () => {
      setConfig(getOvelink(cleanSlug));
    };
    load();

    const handleUpdate = () => load();
    window.addEventListener("ovel:brand_updated", handleUpdate);
    window.addEventListener("ovel:data_updated", handleUpdate);
    window.addEventListener(STORE_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("ovel:brand_updated", handleUpdate);
      window.removeEventListener("ovel:data_updated", handleUpdate);
      window.removeEventListener(STORE_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [cleanSlug, router]);

  if (!config) {
    return (
      <div className="min-h-screen bg-[#F6FAF9] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#105F68] border-t-transparent animate-spin" />
      </div>
    );
  }

  return <OvelinkView config={config} />;
}
