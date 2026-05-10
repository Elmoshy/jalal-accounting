import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !["super_admin", "city_admin"].includes(session.user.role))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { paidAmount, installmentAmount, remaining, status, notes } = body;

  const existing = await prisma.loan.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.user.role !== "super_admin" && existing.locationId !== session.user.locationId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const data: Record<string, unknown> = {};
  if (paidAmount !== undefined) data.paidAmount = paidAmount;
  if (installmentAmount !== undefined) data.installmentAmount = installmentAmount;
  if (remaining !== undefined) data.remaining = remaining;
  if (status) data.status = status;
  if (notes !== undefined) data.notes = notes;

  const loan = await prisma.loan.update({ where: { id }, data });
  return NextResponse.json({ loan });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !["super_admin", "city_admin"].includes(session.user.role))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.loan.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.user.role !== "super_admin" && existing.locationId !== session.user.locationId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.loan.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
