"use client";

import React, { useMemo } from "react";
import { useParams } from "next/navigation";
import { getOvelink } from "@/lib/ovelink-store";
import OvelinkView from "@/components/OvelinkView";

export default function PublicBookingPage() {
  const params = useParams();
  const slug = (params?.slug as string) || "leclat";

  const config = useMemo(() => {
    return getOvelink(slug);
  }, [slug]);

  return <OvelinkView config={config} />;
}
