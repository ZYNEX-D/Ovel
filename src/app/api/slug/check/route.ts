import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { auth } from "@clerk/nextjs/server";

const RESERVED = [
  "api", "login", "signup", "dashboard", "admin", "settings", "portal",
  "quotes", "invoices", "services", "team", "staff", "roster", "reviews",
  "reminders", "auth", "root", "public", "l", "quote", "my-brand", "my-business"
];

const PRESETS = ["leclat", "apex-studio", "vance-studio", "craft-bakes"];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawSlug = searchParams.get("slug") || "";

  const cleanSlug = rawSlug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!cleanSlug || cleanSlug.length < 2) {
    return NextResponse.json({
      available: false,
      slug: cleanSlug,
      error: "URL handle must be at least 2 characters.",
    });
  }

  if (cleanSlug.length > 45) {
    return NextResponse.json({
      available: false,
      slug: cleanSlug,
      error: "URL handle cannot exceed 45 characters.",
    });
  }

  if (RESERVED.includes(cleanSlug)) {
    return NextResponse.json({
      available: false,
      slug: cleanSlug,
      error: `"${cleanSlug}" is a reserved system URL handle.`,
    });
  }

  if (PRESETS.includes(cleanSlug)) {
    return NextResponse.json({
      available: false,
      slug: cleanSlug,
      error: `"${cleanSlug}" is reserved for platform templates.`,
    });
  }

  // Check Clerk user accounts database if Clerk is active
  try {
    const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    const isClerkActive = Boolean(
      publishableKey &&
      !publishableKey.includes("placeholder") &&
      publishableKey.startsWith("pk_")
    );

    if (isClerkActive && process.env.CLERK_SECRET_KEY) {
      const client = await clerkClient();
      const authData = await auth().catch(() => null);
      const currentUserId = authData?.userId;

      const userList = await client.users.getUserList({ limit: 100 }).catch(() => null);
      // In Clerk SDK, getUserList returns { data: User[], totalCount: number } or array
      const users = (userList as { data?: Array<{ id: string; username?: string | null; unsafeMetadata?: Record<string, unknown> }> })?.data ||
        (Array.isArray(userList) ? userList : []);

      const existingUser = users.find((u) => {
        if (currentUserId && u.id === currentUserId) return false;
        const metaSlug = typeof u.unsafeMetadata?.businessSlug === "string"
          ? u.unsafeMetadata.businessSlug.toLowerCase().trim()
          : null;
        const username = typeof u.username === "string" ? u.username.toLowerCase().trim() : null;
        return metaSlug === cleanSlug || username === cleanSlug;
      });

      if (existingUser) {
        return NextResponse.json({
          available: false,
          slug: cleanSlug,
          error: `Handle "${cleanSlug}" is already taken by another business.`,
        });
      }
    }
  } catch (err) {
    // If Clerk check fails or in demo mode, continue gracefully
    console.warn("Clerk slug availability check warning:", err);
  }

  return NextResponse.json({
    available: true,
    slug: cleanSlug,
  });
}
