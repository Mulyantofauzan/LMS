import { signOut } from "@/auth";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    await signOut({ redirect: false });
  } catch {
    // signOut may throw a NEXT_REDIRECT, which is expected
  }
  return NextResponse.json({ success: true });
}
