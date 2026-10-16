import { redirect } from "next/navigation";
import SSOCallbackClient from "./SSOCallbackClient";

function clerkConfigured() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return Boolean(
    publishableKey &&
    !publishableKey.includes("placeholder") &&
    publishableKey.startsWith("pk_"),
  );
}

export default function SSOCallbackPage() {
  if (!clerkConfigured()) redirect("/login");
  return <SSOCallbackClient />;
}
