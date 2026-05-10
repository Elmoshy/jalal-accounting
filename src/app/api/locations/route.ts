import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "super_admin") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const items = await prisma.location.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "super_admin") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const body = await req.json();
  const { name, governorate, address, phone } = body;
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });
  const item = await prisma.location.create({ data: { name, governorate, address, phone } });
  return NextResponse.json({ item });
}
