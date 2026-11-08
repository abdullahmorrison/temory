import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session-cookie";

// A quick check before any page: without a session cookie, go to Sign in. Whether the session is real is
// checked by signedIn() wherever data is read or written (lib/session.ts).
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();
  return NextResponse.redirect(new URL("/sign-in", request.url));
}

export const config = {
  // Everything but Sign in, Create account, Next's own files, and files like icons and the manifest.
  matcher: ["/((?!sign-in|sign-up|_next/|icons/|.*\\.).*)"],
};
