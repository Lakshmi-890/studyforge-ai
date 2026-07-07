import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";
  try {
    const code = requestUrl.searchParams.get("code");

    if (code) {
      const supabase = await createClient();
      await supabase.auth.exchangeCodeForSession(code);
    }
  } catch (error) {
    console.error("Auth callback error:", error);
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${requestUrl.origin}${next}`);
}
