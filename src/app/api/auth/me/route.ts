import { NextResponse } from "next/server";
import { DEMO_USERS } from "@/lib/data/store";

export async function GET() {
  // In demo mode, return the primary officer session
  return NextResponse.json({
    user: DEMO_USERS.police,
    authenticated: true,
    rolesAvailable: Object.keys(DEMO_USERS),
  });
}
