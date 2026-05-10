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
  const category = searchParams.get("category");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const where: Record<string, unknown> = { ...locFilter(session) };
  if (category) where.category = category;
  if (from || to) where.date = { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) };
  const items = await prisma.expense.findMany({ where, include: { user: { select: { name: true } } }, orderBy: { date: "desc" } });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !["super_admin", "city_admin", "accountant"].includes(session.user.role))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const body = await req.json();
  const { category, amount, description, date, receiptNo, notes } = body;
  if (!category || !amount || !description) return NextResponse.json({ error: "category, amount, description are required" }, { status: 400 });
  const locationId = session.user.role === "super_admin" ? body.locationId : session.user.locationId!;
  const item = await prisma.expense.create({ data: { category, amount, description, date: date ? new Date(date) : new Date(), receiptNo, notes, userId: session.user.id!, locationId } });
  return NextResponse.json({ item });
}
