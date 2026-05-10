import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !["super_admin", "city_admin", "accountant"].includes(session.user.role))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await params;
  const existing = await prisma.inventory.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.user.role !== "super_admin" && existing.locationId !== session.user.locationId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const item = await prisma.inventory.update({ where: { id }, data: { itemCode: body.itemCode, itemName: body.itemName, category: body.category, unit: body.unit, qty: body.qty, unitPrice: body.unitPrice, minQty: body.minQty } });
  return NextResponse.json({ item });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !["super_admin", "city_admin"].includes(session.user.role))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await params;
  const existing = await prisma.inventory.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.user.role !== "super_admin" && existing.locationId !== session.user.locationId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.inventory.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
