"use client";
import { SignIn } from "@clerk/nextjs";

// Clerk handles password recovery, client trust, MFA, and OAuth callbacks.
export default function ClerkCustomSignIn() {
  return <SignIn routing="hash" signUpUrl="/signup" forceRedirectUrl="/auth/redirect"
    signUpForceRedirectUrl="/auth/redirect"
    appearance={{ variables: { colorPrimary: "#105F68", borderRadius: "1rem" }, elements: {
      rootBox: "w-full", cardBox: "w-full shadow-none", card: "shadow-none border-0 p-0",
      footer: { display: "none" },
    } }} />;
}
