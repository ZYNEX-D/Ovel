import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isClerkActive = Boolean(
    publishableKey &&
    !publishableKey.includes("placeholder") &&
    publishableKey.startsWith("pk_"),
  );

  if (isClerkActive) {
    const { userId, sessionClaims } = await auth();
    if (!userId) redirect("/login");

    // Fast local JWT role check without blocking external network call
    const metadata = (sessionClaims?.metadata as Record<string, unknown>) || {};
    if (metadata?.role === "super_admin") {
      redirect("/admin");
    }
  }

  return <DashboardShell>{children}</DashboardShell>;
}
