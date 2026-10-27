import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { getWorkspaceProfile } from "@/lib/clerk-api";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  // Always allow the admin login page to render without redirection
  if (pathname.startsWith("/admin/login")) {
    return <>{children}</>;
  }

  const cookieStore = await cookies();
  const adminCookie = cookieStore.get("ovel_admin_session")?.value;

  if (adminCookie === "super_admin" || adminCookie === "active") {
    return <>{children}</>;
  }

  const profile = await getWorkspaceProfile();
  if (!profile) {
    if (process.env.NODE_ENV === "development") {
      return <>{children}</>;
    }
    redirect("/admin/login");
  }

  if (profile.role !== "super_admin" && adminCookie !== "super_admin") {
    redirect("/admin/login");
  }

  return <>{children}</>;
}
