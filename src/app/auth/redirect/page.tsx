import { redirect } from "next/navigation";
import { getWorkspaceProfile } from "@/lib/clerk-api";

export default async function AuthRedirectPage() {
  const profile = await getWorkspaceProfile();
  redirect(!profile ? "/login" : profile.role === "super_admin" ? "/admin" : "/dashboard");
}
