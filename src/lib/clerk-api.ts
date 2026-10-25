import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { cache } from "react";

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

function clerkConfigured() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return Boolean(
    publishableKey &&
    !publishableKey.includes("placeholder") &&
    publishableKey.startsWith("pk_"),
  );
}

export const getWorkspaceProfile = cache(async () => {
  if (!clerkConfigured()) return null;
  const user = await currentUser();
  if (!user) return null;
  const email = user.primaryEmailAddress?.emailAddress || "";
  const adminEmail = process.env.DEVELOPER_SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const isAdmin = Boolean(adminEmail) && user.emailAddresses.some(
    (address) => address.emailAddress.toLowerCase() === adminEmail && address.verification?.status === "verified"
  );

  const fallbackName = user.fullName
    ? `${user.fullName}'s Studio`
    : email ? `${email.split("@")[0]}'s Studio` : "Studio Workspace";

  const businessName = typeof user.unsafeMetadata?.businessName === "string" && user.unsafeMetadata.businessName.trim()
    ? user.unsafeMetadata.businessName.trim()
    : fallbackName;

  const derivedHandle = (user.username || (email ? email.split("@")[0] : `biz-${user.id.slice(-6)}`))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || `biz-${user.id.slice(-6)}`;

  const slug = typeof user.unsafeMetadata?.businessSlug === "string" && user.unsafeMetadata.businessSlug.trim()
    ? user.unsafeMetadata.businessSlug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")
    : derivedHandle;

  const avatarUrl = (typeof user.unsafeMetadata?.avatarUrl === "string" && user.unsafeMetadata.avatarUrl)
    ? user.unsafeMetadata.avatarUrl
    : (user.imageUrl || undefined);

  const businessType = typeof user.unsafeMetadata?.businessType === "string" && ["services", "products", "both"].includes(user.unsafeMetadata.businessType)
    ? (user.unsafeMetadata.businessType as "services" | "products" | "both")
    : "both";

  const businessBio = typeof user.unsafeMetadata?.businessBio === "string" ? user.unsafeMetadata.businessBio : "";
  const businessTagline = typeof user.unsafeMetadata?.businessTagline === "string" ? user.unsafeMetadata.businessTagline : "";
  const logoUrl = typeof user.unsafeMetadata?.logoUrl === "string" ? user.unsafeMetadata.logoUrl : "";
  const greetings = typeof user.unsafeMetadata?.greetings === "string" ? user.unsafeMetadata.greetings : "";
  const onboardingCompleted = Boolean(user.unsafeMetadata?.onboardingCompleted);

  return {
    id: user.id,
    email,
    fullName: user.fullName || email.split("@")[0] || "Merchant",
    avatarUrl,
    logoUrl,
    businessType,
    businessBio,
    businessTagline,
    greetings,
    onboardingCompleted,
    role: isAdmin ? "super_admin" as const : "business_owner" as const,
    organizationId: isAdmin ? "org_root" : `org_${user.id}`,
    organizationName: isAdmin ? "Ovel Global Platform" : businessName,
    organizationSlug: isAdmin ? "root" : slug,
    permissions: isAdmin ? ["all:super_admin"] : ["bookings:manage", "invoicing:manage", "staff:manage"],
    status: "active" as const,
    lastLogin: "Just now",
  };
});
