import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db";

const DEFAULT_PASSWORD = "00000";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const hashedPassword = await hash(DEFAULT_PASSWORD, 12);

    const cairo = await prisma.location.upsert({
      where: { name: "القاهرة" },
      update: {},
      create: { name: "القاهرة", governorate: "القاهرة", address: "مقر الشركة الرئيسي", phone: "02-xxxxxxx" },
    });
    const alex = await prisma.location.upsert({
      where: { name: "الإسكندرية" },
      update: {},
      create: { name: "الإسكندرية", governorate: "الإسكندرية", address: "المنشية", phone: "03-xxxxxxx" },
    });
    const hurghada = await prisma.location.upsert({
      where: { name: "الغردقة" },
      update: {},
      create: { name: "الغردقة", governorate: "البحر الأحمر", address: "الممشى", phone: "065-xxxxxxx" },
    });
    const sharm = await prisma.location.upsert({
      where: { name: "شرم الشيخ" },
      update: {},
      create: { name: "شرم الشيخ", governorate: "جنوب سيناء", address: "منطقة نبق", phone: "069-xxxxxxx" },
    });
    const marsa = await prisma.location.upsert({
      where: { name: "مرسى علم" },
      update: {},
      create: { name: "مرسى علم", governorate: "البحر الأحمر", address: "ميناء مرسى علم", phone: "065-xxxxxxx" },
    });

    await prisma.user.upsert({
      where: { email: "admin@jalal-eg.com" },
      update: {},
      create: {
        name: "المدير العام",
        email: "admin@jalal-eg.com",
        password: hashedPassword,
        role: "super_admin",
      },
    });

    const cities = [cairo, alex, hurghada, sharm, marsa];
    for (const city of cities) {
      await prisma.user.upsert({
        where: { email: `admin-${city.name}@jalal-eg.com` },
        update: {},
        create: {
          name: `مدير ${city.name}`,
          email: `admin-${city.name}@jalal-eg.com`,
          password: hashedPassword,
          role: "city_admin",
          locationId: city.id,
        },
      });
    }

    for (const city of cities) {
      const employees = [
        { name: `مهندس موقع - ${city.name}`, position: "مهندس موقع", baseSalary: 8500 },
        { name: `محاسب - ${city.name}`, position: "محاسب", baseSalary: 6000 },
        { name: `أمين مخزن - ${city.name}`, position: "أمين مخزن", baseSalary: 4500 },
      ];
      for (const emp of employees) {
        await prisma.employee.create({
          data: { ...emp, locationId: city.id },
        });
      }
    }

    for (const city of cities) {
      await prisma.supplier.create({
        data: { name: `الرضا للمقاولات - ${city.name}`, phone: "01xxxxxxxxx", address: city.address ?? "", locationId: city.id },
      });
      await prisma.supplier.create({
        data: { name: `النيل للتوريدات - ${city.name}`, phone: "01xxxxxxxxx", address: city.address ?? "", locationId: city.id },
      });
    }

    for (const city of cities) {
      const items = [
        { itemCode: "CBL-001", itemName: "كابل نحاس 4 مم", category: "كابلات", unit: "متر", qty: 500, unitPrice: 35 },
        { itemCode: "CBL-002", itemName: "كابل نحاس 6 مم", category: "كابلات", unit: "متر", qty: 300, unitPrice: 55 },
        { itemCode: "FIT-001", itemName: "ماسورة PVC 20 مم", category: "مواسير", unit: "قطعة", qty: 200, unitPrice: 12 },
        { itemCode: "SWT-001", itemName: "مفتاح كهرباء 1 فاز", category: "مفاتيح", unit: "قطعة", qty: 100, unitPrice: 25 },
        { itemCode: "LMP-001", itemName: "لمبة LED 15 وات", category: "إضاءة", unit: "قطعة", qty: 150, unitPrice: 18 },
      ];
      for (const item of items) {
        await prisma.inventory.create({
          data: { ...item, locationId: city.id },
        });
      }
    }

    return NextResponse.json({ message: `✅ Seed completed. Default password: ${DEFAULT_PASSWORD}` });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
