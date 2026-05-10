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
  const month = searchParams.get("month");
  const year = searchParams.get("year");
  const employeeId = searchParams.get("employeeId");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  const where: Record<string, unknown> = { ...getLocationFilter(session) };
  if (month) where.month = parseInt(month);
  if (year) where.year = parseInt(year);
  if (employeeId) where.employeeId = employeeId;

  const [salaries, total] = await Promise.all([
    prisma.salary.findMany({
      where,
      include: { employee: { select: { name: true, position: true } } },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.salary.count({ where }),
  ]);

  return NextResponse.json({ salaries, total, page, limit });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !["super_admin", "city_admin", "accountant"].includes(session.user.role))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await req.json();
  const { employeeId, month, year, base, bonuses, deductions, net, paidDate, notes } = body;

  if (!employeeId || !month || !year) {
    return NextResponse.json({ error: "employeeId, month, and year are required" }, { status: 400 });
  }

  const locationId = session.user.role === "super_admin"
    ? body.locationId
    : session.user.locationId!;

  const salary = await prisma.salary.create({
    data: {
      employeeId,
      month,
      year,
      base: base || 0,
      bonuses: bonuses || 0,
      deductions: deductions || 0,
      net: net || 0,
      paidDate: paidDate ? new Date(paidDate) : new Date(),
      notes,
      userId: session.user.id!,
      locationId,
    },
  });

  return NextResponse.json({ salary });
}
