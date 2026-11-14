import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export default proxy;

export const config = {
  matcher: [
    /*
     * Auth refresh + route gates. Exclude Next internals, static files i /ingest
     * (proxy do PostHog — nie ma tam sesji do odświeżania).
     */
    "/((?!_next/static|_next/image|favicon.ico|brand/|ingest(?:/|$)|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest)$).*)",
  ],
};
