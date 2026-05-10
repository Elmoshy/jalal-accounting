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
  const { type, startDate, endDate, days, status, notes } = body;

  const existing = await prisma.vacation.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.user.role !== "super_admin" && existing.locationId !== session.user.locationId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const vacation = await prisma.vacation.update({
    where: { id },
    data: { type, startDate: startDate ? new Date(startDate) : undefined, endDate: endDate ? new Date(endDate) : undefined, days, status, notes },
  });

  return NextResponse.json({ vacation });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !["super_admin", "city_admin"].includes(session.user.role))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.vacation.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.user.role !== "super_admin" && existing.locationId !== session.user.locationId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.vacation.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
