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
  const body = await req.json();
  const { checkIn, checkOut, status, overtimeHours, notes } = body;

  const existing = await prisma.attendance.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.role !== "super_admin" && existing.locationId !== session.user.locationId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const attendance = await prisma.attendance.update({
    where: { id },
    data: {
      checkIn: checkIn ? new Date(checkIn) : undefined,
      checkOut: checkOut ? new Date(checkOut) : undefined,
      status, overtimeHours, notes,
    },
  });

  return NextResponse.json({ attendance });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !["super_admin", "city_admin"].includes(session.user.role))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.attendance.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.role !== "super_admin" && existing.locationId !== session.user.locationId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.attendance.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
