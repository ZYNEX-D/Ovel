"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useAudio } from "@/components/AudioController";

export default function ClickLink({
  href,
  className,
  children,
  target,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  target?: string;
}) {
  const { playClick } = useAudio();

  return (
    <Link href={href} target={target} onClick={() => playClick()} className={className}>
      {children}
    </Link>
  );
}
