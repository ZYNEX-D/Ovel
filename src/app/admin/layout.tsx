import { redirect } from "next/navigation";
import { getWorkspaceProfile } from "@/lib/clerk-api";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getWorkspaceProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "super_admin") redirect("/dashboard");
  return children;
}
