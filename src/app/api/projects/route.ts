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
  const status = searchParams.get("status");
  const where: Record<string, unknown> = { ...locFilter(session) };
  if (status) where.status = status;
  const items = await prisma.project.findMany({ where, orderBy: { startDate: "desc" } });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !["super_admin", "city_admin", "accountant"].includes(session.user.role))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const body = await req.json();
  const { name, projectLocation, startDate, endDate, status } = body;
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });
  const locationId = session.user.role === "super_admin" ? body.locationId : session.user.locationId!;
  const item = await prisma.project.create({ data: { name, projectLocation, startDate: startDate ? new Date(startDate) : undefined, endDate: endDate ? new Date(endDate) : undefined, status: status || "active", locationId } });
  return NextResponse.json({ item });
}
