import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { requireApiAuth } from "@/lib/clerk-api";

export async function POST() {
  const authResult = await requireApiAuth();

  if (!authResult.isAuthenticated || !authResult.userId) {
    return (
      authResult.response ||
      NextResponse.json(
        { error: "Unauthorized", message: "User session required to delete account." },
        { status: 401 }
      )
    );
  }

  try {
    const client = await clerkClient();
    await client.users.deleteUser(authResult.userId);

    return NextResponse.json({
      success: true,
      message: "User account and credentials deleted permanently.",
      deletedUserId: authResult.userId,
    });
  } catch (err: unknown) {
    const errorMessage = (err as Error)?.message || "Failed to delete user account via Clerk.";
    // If user is already deleted or in mock mode, return success gracefully
    if (errorMessage.includes("not found") || errorMessage.includes("404")) {
      return NextResponse.json({
        success: true,
        message: "User account was already deleted or not found.",
      });
    }

    return NextResponse.json(
      {
        error: "DeleteAccountFailed",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
