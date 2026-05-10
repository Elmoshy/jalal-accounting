import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "super_admin") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = { name: body.name, email: body.email, role: body.role, locationId: body.locationId, isActive: body.isActive };
  if (body.password) { const { hash } = await import("bcryptjs"); data.password = await hash(body.password, 12); }
  const user = await prisma.user.update({ where: { id }, data });
  return NextResponse.json({ user });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "super_admin") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await params;
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
