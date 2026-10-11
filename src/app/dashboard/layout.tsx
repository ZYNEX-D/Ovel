import { getWorkspaceProfile } from "@/lib/clerk-api";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await getWorkspaceProfile();
  if (!profile) redirect("/login");
  if (profile.role === "super_admin") redirect("/admin");
  return <DashboardShell>{children}</DashboardShell>;
}
