import { NextRequest, NextResponse } from "next/server";
import { getWorkspaceProfile } from "@/lib/clerk-api";

// Complete the auth handoff with an HTTP redirect. A streamed page redirect
// can stall while Clerk and the App Router both update the active session.
export async function GET(request: NextRequest) {
  const profile = await getWorkspaceProfile();
  const destination = !profile
    ? "/login"
    : profile.role === "super_admin" ? "/admin" : "/dashboard";
  const response = NextResponse.redirect(new URL(destination, request.url));
  response.headers.set("Cache-Control", "no-store");
  return response;
}
