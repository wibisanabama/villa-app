import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(items) {
        items.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        items.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  const protectedRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/staff") || pathname.startsWith("/admin") || pathname === "/profile" || pathname === "/become-owner";
  if (protectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/search";
    url.searchParams.set("login", "required");
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = { matcher: ["/dashboard/:path*", "/staff/:path*", "/admin/:path*", "/profile", "/become-owner"] };
