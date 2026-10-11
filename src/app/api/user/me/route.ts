import { NextResponse } from "next/server";
import { requireApiAuth, getWorkspaceProfile } from "@/lib/clerk-api";

/**
 * Example Authenticated API Endpoint
 * Protected by Clerk on the server side
 */
export async function GET() {
  const authResult = await requireApiAuth();

  if (!authResult.isAuthenticated) {
    return authResult.response!;
  }

  return NextResponse.json({
    success: true,
    userId: authResult.userId,
    email: authResult.email,
    userFullName: authResult.userFullName,
    orgId: authResult.orgId,
    orgRole: authResult.orgRole,
    authProvider: "Clerk",
    status: "Authenticated",
    profile: await getWorkspaceProfile(),
  });
}
