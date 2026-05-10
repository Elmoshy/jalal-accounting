import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function locFilter(s: { user: { role: string; locationId?: string | null } }) {
  return s.user.role === "super_admin" ? {} : { locationId: s.user.locationId! };
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const supplierId = searchParams.get("supplierId");
  const where: Record<string, unknown> = { ...locFilter(session) };
  if (supplierId) where.supplierId = supplierId;
  if (from || to) where.date = { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) };
  const items = await prisma.invoice.findMany({ where, include: { supplier: { select: { id: true, name: true } }, items: true }, orderBy: { date: "desc" } });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !["super_admin", "city_admin", "accountant"].includes(session.user.role))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const body = await req.json();
  const { invNo, date, subtotal, tax, total, notes, supplierId, projectId, items } = body;
  if (!invNo || !supplierId) return NextResponse.json({ error: "invNo and supplierId are required" }, { status: 400 });
  const locationId = session.user.role === "super_admin" ? body.locationId : session.user.locationId!;
  const invoice = await prisma.invoice.create({
    data: { invNo, date: date ? new Date(date) : new Date(), subtotal: subtotal || 0, tax: tax || 0, total: total || 0, notes, supplierId, projectId, locationId, userId: session.user.id!,
      items: { create: (items || []).map((i: { code: string; name: string; qty: number; unit: string; price: number; total: number }) => ({ code: i.code, name: i.name, qty: i.qty, unit: i.unit || "قطعة", price: i.price, total: i.total })) },
    },
  });
  return NextResponse.json({ invoice });
}
