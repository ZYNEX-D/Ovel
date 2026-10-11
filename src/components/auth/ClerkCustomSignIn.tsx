"use client";
import { SignIn } from "@clerk/nextjs";

// Clerk handles password recovery, client trust, MFA, and OAuth callbacks.
export default function ClerkCustomSignIn() {
  return (
    <SignIn
      routing="hash"
      signUpUrl="/signup"
      forceRedirectUrl="/auth/redirect"
      appearance={{
        variables: {
          colorPrimary: "#105F68",
          borderRadius: "1rem",
        },
        elements: {
          rootBox: "w-full overflow-visible",
          cardBox: "w-full shadow-none overflow-visible",
          card: "shadow-none border-0 p-0 bg-transparent overflow-visible",
          socialButtonsBlockButton:
            "w-full min-h-[48px] h-auto py-3 px-4 rounded-2xl border border-black/10 hover:bg-[#F6FAF9] text-xs sm:text-sm font-medium text-[#105F68] transition-all flex items-center justify-center overflow-visible shadow-sm",
          socialButtonsBlockButtonText:
            "text-xs sm:text-sm font-medium text-[#105F68] leading-normal overflow-visible",
          socialButtonsBlockButtonLogo: "w-4 h-4 mr-2.5 shrink-0",
          formButtonPrimary:
            "w-full min-h-[48px] h-auto py-3.5 px-4 rounded-2xl bg-[#105F68] hover:bg-[#0D4F57] text-white text-xs sm:text-sm font-medium tracking-tight transition-all shadow-md shadow-[#105F68]/20 flex items-center justify-center overflow-visible",
          formFieldInput:
            "w-full min-h-[46px] h-auto py-3 px-4 rounded-2xl bg-[#F6FAF9] border border-black/10 text-xs sm:text-sm text-[#105F68] focus:border-[#105F68] focus:outline-none transition-all leading-normal",
          formFieldLabel:
            "text-xs uppercase tracking-wider text-[#3A9295] font-light mb-1.5",
          formFieldAction:
            "text-xs text-[#3A9295] hover:text-[#105F68] leading-normal transition-colors",
          badge:
            "px-2.5 py-1 text-[11px] rounded-full leading-normal overflow-visible bg-[#C8E6E2]/40 text-[#105F68] font-medium border border-[#9ED5D1]/60",
          headerTitle: "text-xl font-light text-[#105F68] tracking-tight",
          headerSubtitle: "text-xs text-[#3A9295] font-light mt-1",
          dividerRow: "my-4",
          dividerLine: "bg-black/10",
          dividerText: "text-xs text-[#3A9295] font-light uppercase tracking-wider px-3",
          formFieldRow: "space-y-1.5",
          footer: { display: "none" },
        },
      }}
    />
  );
}
