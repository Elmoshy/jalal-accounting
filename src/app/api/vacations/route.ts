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
  const employeeId = searchParams.get("employeeId");
  const year = searchParams.get("year");
  const type = searchParams.get("type");

  const where: Record<string, unknown> = { ...getLocationFilter(session) };
  if (employeeId) where.employeeId = employeeId;
  if (type) where.type = type;
  if (year) {
    const y = parseInt(year);
    where.startDate = { gte: new Date(y, 0, 1), lte: new Date(y, 11, 31) };
  }

  const vacations = await prisma.vacation.findMany({
    where,
    include: { employee: { select: { name: true, position: true } } },
    orderBy: [{ startDate: "desc" }],
  });

  return NextResponse.json(vacations);
}

const MAX_VACATION_DAYS_PER_YEAR = 84;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !["super_admin", "city_admin"].includes(session.user.role))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await req.json();
  const { employeeId, type, startDate, endDate, days, status, notes } = body;

  if (!employeeId || !type || !startDate || !endDate || !days) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const locationId = session.user.role === "super_admin" ? body.locationId : session.user.locationId!;

  // Check yearly vacation days limit
  const year = new Date(startDate).getFullYear();
  const usedDays = await prisma.vacation.aggregate({
    where: {
      employeeId,
      startDate: { gte: new Date(year, 0, 1), lte: new Date(year, 11, 31) },
      status: { not: "rejected" },
    },
    _sum: { days: true },
  });
  const totalUsed = (usedDays._sum.days || 0) + days;
  if (totalUsed > MAX_VACATION_DAYS_PER_YEAR) {
    return NextResponse.json({
      error: `تجاوز الحد المسموح به للإجازات (${MAX_VACATION_DAYS_PER_YEAR} يوم/السنة). المستخدم: ${usedDays._sum.days || 0}، المتبقي: ${MAX_VACATION_DAYS_PER_YEAR - (usedDays._sum.days || 0)}`,
    }, { status: 400 });
  }

  const vacation = await prisma.vacation.create({
    data: { employeeId, type, startDate: new Date(startDate), endDate: new Date(endDate), days, status: status || "pending", notes, locationId },
  });

  return NextResponse.json({ vacation });
}
