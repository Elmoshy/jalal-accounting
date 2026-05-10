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
  const item = await prisma.location.update({ where: { id }, data: { name: body.name, governorate: body.governorate, address: body.address, phone: body.phone, isActive: body.isActive } });
  return NextResponse.json({ item });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "super_admin") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await params;
  const existing = await prisma.location.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.location.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
