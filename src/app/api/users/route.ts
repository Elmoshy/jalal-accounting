import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "super_admin") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const users = await prisma.user.findMany({ include: { location: { select: { name: true } } }, orderBy: { name: "asc" } });
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "super_admin") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const body = await req.json();
  const { name, email, password, role, locationId } = body;
  if (!name || !email || !password) return NextResponse.json({ error: "name, email, password are required" }, { status: 400 });
  const { hash } = await import("bcryptjs");
  const hashedPassword = await hash(password, 12);
  const user = await prisma.user.create({ data: { name, email, password: hashedPassword, role: role || "viewer", locationId } });
  return NextResponse.json({ user });
}
