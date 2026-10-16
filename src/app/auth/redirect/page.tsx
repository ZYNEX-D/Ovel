import { redirect } from "next/navigation";
import AuthRedirectClient from "./AuthRedirectClient";

function clerkConfigured() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return Boolean(
    publishableKey &&
    !publishableKey.includes("placeholder") &&
    publishableKey.startsWith("pk_"),
  );
}

export default function AuthRedirectPage() {
  if (!clerkConfigured()) redirect("/login");
  return <AuthRedirectClient />;
}
