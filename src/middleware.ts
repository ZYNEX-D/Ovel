import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define public routes that do NOT require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/login(.*)",
  "/signup(.*)",
  "/forgot-password(.*)",
  "/sso-callback(.*)",
  "/l(.*)",
  "/book(.*)",
  "/quote(.*)",
  "/portal(.*)",
  "/api/webhooks(.*)",
  "/api/public(.*)",
]);

const isClerkActive = !!(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("placeholder") &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_")
);

export default isClerkActive
  ? clerkMiddleware(
      async (auth, req) => {
        if (!isPublicRoute(req)) {
          await auth.protect({
            unauthenticatedUrl: new URL("/login", req.url).toString(),
          });
        }
      },
      {
        signInUrl: "/login",
        signUpUrl: "/signup",
      }
    )
  : () => NextResponse.next();

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
