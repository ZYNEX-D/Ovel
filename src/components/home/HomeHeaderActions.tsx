"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AudioToggle, useAudio } from "@/components/AudioController";
import UserAuthNav from "@/components/UserAuthNav";
import { useAuth } from "@/lib/auth-context";

export default function HomeHeaderActions() {
  const { playClick } = useAudio();
  const { profile, isLoading } = useAuth();

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <AudioToggle />
      <UserAuthNav />

      {!isLoading && profile ? (
        <Link
          href={profile.role === "super_admin" ? "/admin" : "/dashboard"}
          onClick={() => playClick()}
          className="group bg-[#105F68] text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-light tracking-tight hover:bg-[#0D4F57] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2"
        >
          <span>{profile.role === "super_admin" ? "Admin Console" : "Dashboard"}</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      ) : null}
    </div>
  );
}
