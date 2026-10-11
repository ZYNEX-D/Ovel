import { redirect } from "next/navigation";
import { getWorkspaceProfile } from "@/lib/clerk-api";

export default async function LoginLayout({ children }: { children: React.ReactNode }) {
  const profile = await getWorkspaceProfile();
  if (profile) redirect(profile.role === "super_admin" ? "/admin" : "/dashboard");
  return children;
}
