import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define public routes that do NOT require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/login(.*)",
  "/signup(.*)",
  "/forgot-password(.*)",
  "/sso-callback(.*)",
  "/auth/redirect(.*)",
  "/l/(.*)",
  "/book/(.*)",
  "/quote/(.*)",
  "/portal/(.*)",
  "/api/webhooks/(.*)",
  "/api/public/(.*)",
]);

const isClerkActive = !!(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("placeholder") &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_")
);

export default isClerkActive
  ? clerkMiddleware(async (auth, req) => {
      if (!isPublicRoute(req)) {
        const { userId } = await auth();
        if (!userId) {
          if (req.nextUrl.pathname.startsWith("/api/")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
          }
          const loginUrl = new URL("/login", req.url);
          return NextResponse.redirect(loginUrl);
        }
      }
    }, {
      // Local clocks can lag Clerk by a few seconds and otherwise cause a
      // token-refresh loop. Keep the normal verification policy in production.
      clockSkewInMs: process.env.NODE_ENV === "development" ? 15000 : 5000,
    })
  : () => NextResponse.next();

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
