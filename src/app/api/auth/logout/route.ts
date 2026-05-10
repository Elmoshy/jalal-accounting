import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // NextAuth v4 credentials provider: signOut is client-side via signOut()
  // Server-side we return success — the client calls signOut()
  return NextResponse.json({ success: true });
}
