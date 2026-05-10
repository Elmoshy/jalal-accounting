import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function getLocationFilter(session: { user: { role: string; locationId?: string | null } }) {
  return session.user.role === "super_admin" ? {} : { locationId: session.user.locationId! };
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const employeeId = searchParams.get("employeeId");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = { ...getLocationFilter(session) };
  if (date) where.date = new Date(date);
  if (employeeId) where.employeeId = employeeId;
  if (status) where.status = status;

  const attendances = await prisma.attendance.findMany({
    where,
    include: { employee: { select: { name: true, position: true } } },
    orderBy: [{ date: "desc" }, { employee: { name: "asc" } }],
  });

  return NextResponse.json(attendances);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !["super_admin", "city_admin", "accountant"].includes(session.user.role))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await req.json();
  const { employeeId, date, checkIn, checkOut, status, overtimeHours, notes } = body;

  if (!employeeId || !date) {
    return NextResponse.json({ error: "employeeId and date are required" }, { status: 400 });
  }

  const locationId = session.user.role === "super_admin" ? body.locationId : session.user.locationId!;

  const attendance = await prisma.attendance.upsert({
    where: { employeeId_date: { employeeId, date: new Date(date) } },
    update: { checkIn: checkIn ? new Date(checkIn) : undefined, checkOut: checkOut ? new Date(checkOut) : undefined, status, overtimeHours, notes },
    create: {
      employeeId, date: new Date(date),
      checkIn: checkIn ? new Date(checkIn) : null,
      checkOut: checkOut ? new Date(checkOut) : null,
      status: status || "present", overtimeHours: overtimeHours || 0, notes,
      locationId,
    },
  });

  return NextResponse.json({ attendance });
}
