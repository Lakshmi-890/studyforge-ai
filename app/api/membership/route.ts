// import { NextResponse } from "next/server";
// import { createClient } from "@/lib/supabase/server";
// import { createAdminClient } from "@/lib/supabase/server";
// 
// export async function POST(req: Request) {
//   try {
//     const { tier } = await req.json();
//     if (!["free", "pro", "premium"].includes(tier)) {
//       return NextResponse.json({ error: "Invalid membership tier" }, { status: 400 });
//     }
// 
//     // Get authenticated user
//     const supabase = await createClient();
//     const { data: { user } } = await supabase.auth.getUser();
//     if (!user) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }
// 
//     const admin = createAdminClient();
// 
//     // Update memberships table
//     const { data, error } = await admin
//       .from("memberships")
//       .upsert(
//         { user_id: user.id, tier, updated_at: new Date().toISOString() },
//         { onConflict: "user_id" }
//       )
//       .select()
//       .single();
// 
//     if (error) {
//       throw error;
//     }
// 
//     // Update profiles table for consistency
//     const { error: profileErr } = await admin
//       .from("profiles")
//       .update({ membership_tier: tier, updated_at: new Date().toISOString() })
//       .eq("id", user.id);
// 
//     if (profileErr) {
//       console.error("Failed to update profile membership tier:", profileErr);
//     }
// 
//     return NextResponse.json({ success: true, tier: data.tier });
//   } catch (error: any) {
//     console.error("Membership update error:", error);
//     return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
//   }
// }

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ message: "Membership features are disabled." }, { status: 403 });
}
