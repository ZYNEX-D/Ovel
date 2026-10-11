import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export interface AuthContextResult {
  isAuthenticated: boolean;
  userId: string | null;
  orgId?: string | null;
  orgRole?: string | null;
  email?: string | null;
  userFullName?: string | null;
  response?: NextResponse;
}

/**
 * Server-Side API Authentication Guard for Next.js Route Handlers
 * 
 * Usage in Route Handlers:
 * ```ts
 * export async function GET(req: Request) {
 *   const authResult = await requireApiAuth();
 *   if (!authResult.isAuthenticated) return authResult.response!;
 *   
 *   const { userId, orgId } = authResult;
 *   // Process authorized request...
 * }
 * ```
 */
export async function requireApiAuth(): Promise<AuthContextResult> {
  const isClerkActive = !!(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("placeholder")
  );

  if (!isClerkActive) {
    // Development fallback when Clerk API keys are not yet configured
    return {
      isAuthenticated: true,
      userId: "dev_user_root",
      orgId: "org_root",
      orgRole: "admin",
      email: "tharuux@ovel.app",
      userFullName: "Tharuux (Developer Root)",
    };
  }

  try {
    const authData = await auth();

    if (!authData.userId) {
      return {
        isAuthenticated: false,
        userId: null,
        response: NextResponse.json(
          {
            error: "Unauthorized",
            message: "Authentication required via Clerk session token.",
          },
          { status: 401 }
        ),
      };
    }

    const clerkUser = await currentUser();

    return {
      isAuthenticated: true,
      userId: authData.userId,
      orgId: authData.orgId,
      orgRole: authData.orgRole,
      email: clerkUser?.emailAddresses?.[0]?.emailAddress || null,
      userFullName: clerkUser ? `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() : null,
    };
  } catch (err: unknown) {
    return {
      isAuthenticated: false,
      userId: null,
      response: NextResponse.json(
        {
          error: "AuthVerificationFailed",
          message: (err as Error).message || "Failed to verify Clerk credentials",
        },
        { status: 401 }
      ),
    };
  }
}
