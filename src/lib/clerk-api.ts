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
    return {
      isAuthenticated: false,
      userId: null,
      response: NextResponse.json({ error: "Authentication is not configured" }, { status: 503 }),
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

export async function getWorkspaceProfile() {
  const user = await currentUser();
  if (!user) return null;
  const email = user.primaryEmailAddress?.emailAddress || "";
  const adminEmail = process.env.DEVELOPER_SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const isAdmin = Boolean(adminEmail) && user.emailAddresses.some(
    (address) => address.emailAddress.toLowerCase() === adminEmail && address.verification?.status === "verified"
  );
  const businessName = typeof user.unsafeMetadata.businessName === "string"
    ? user.unsafeMetadata.businessName : "My Business";
  const slug = typeof user.unsafeMetadata.businessSlug === "string"
    ? user.unsafeMetadata.businessSlug : businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return {
    id: user.id, email,
    fullName: user.fullName || email.split("@")[0],
    role: isAdmin ? "super_admin" as const : "business_owner" as const,
    organizationId: isAdmin ? "org_root" : `org_${user.id}`,
    organizationName: isAdmin ? "Ovel Global Platform" : businessName,
    organizationSlug: isAdmin ? "root" : slug,
    permissions: isAdmin ? ["all:super_admin"] : ["bookings:manage", "invoicing:manage", "staff:manage"],
    status: "active" as const, lastLogin: "Just now",
  };
}
