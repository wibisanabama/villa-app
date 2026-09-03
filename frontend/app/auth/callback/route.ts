import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const requestedNext = url.searchParams.get("next");
  const next = requestedNext?.startsWith("/") ? requestedNext : "/profile";
  if (code) await (await createClient()).auth.exchangeCodeForSession(code);
  return NextResponse.redirect(new URL(next, url.origin));
}

