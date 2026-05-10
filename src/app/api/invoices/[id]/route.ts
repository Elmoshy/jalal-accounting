import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({ where: { id }, include: { supplier: true, project: true, items: true } });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.user.role !== "super_admin" && invoice.locationId !== session.user.locationId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(invoice);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !["super_admin", "city_admin", "accountant"].includes(session.user.role))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await params;
  const existing = await prisma.invoice.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.user.role !== "super_admin" && existing.locationId !== session.user.locationId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  await prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });
  const invoice = await prisma.invoice.update({ where: { id }, data: { invNo: body.invNo, date: body.date ? new Date(body.date) : undefined, subtotal: body.subtotal, tax: body.tax, total: body.total, notes: body.notes, supplierId: body.supplierId, projectId: body.projectId,
    items: { create: (body.items || []).map((i: { code: string; name: string; qty: number; unit: string; price: number; total: number }) => ({ code: i.code, name: i.name, qty: i.qty, unit: i.unit || "قطعة", price: i.price, total: i.total })) },
  } });
  return NextResponse.json({ invoice });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !["super_admin", "city_admin"].includes(session.user.role))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await params;
  const existing = await prisma.invoice.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.user.role !== "super_admin" && existing.locationId !== session.user.locationId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.invoice.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
