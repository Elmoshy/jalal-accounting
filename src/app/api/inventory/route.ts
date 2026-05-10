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
  const search = searchParams.get("search");
  const where: Record<string, unknown> = { ...locFilter(session) };
  if (category) where.category = category;
  if (search) where.OR = [{ itemName: { contains: search } }, { itemCode: { contains: search } }];
  const items = await prisma.inventory.findMany({ where, include: { location: { select: { name: true } } }, orderBy: { itemName: "asc" } });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !["super_admin", "city_admin", "accountant"].includes(session.user.role))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const body = await req.json();
  const { itemCode, itemName, category, unit, qty, unitPrice, minQty } = body;
  if (!itemCode || !itemName) return NextResponse.json({ error: "itemCode and itemName are required" }, { status: 400 });
  const locationId = session.user.role === "super_admin" ? body.locationId : session.user.locationId!;
  const item = await prisma.inventory.create({ data: { itemCode, itemName, category, unit: unit || "قطعة", qty: qty || 0, unitPrice: unitPrice || 0, minQty, locationId } });
  return NextResponse.json({ item });
}
