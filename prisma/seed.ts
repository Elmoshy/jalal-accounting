import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import pg from "pg";

function parseDbUrl(url: string) {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: parseInt(u.port || "5432"),
    database: u.pathname.slice(1),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  };
}

const pool = new pg.Pool(parseDbUrl(process.env.DATABASE_URL!));
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DEFAULT_PASSWORD = "00000";

async function main() {
  console.log("🌱 Seeding database...");

  const hashedPassword = await hash(DEFAULT_PASSWORD, 12);

  // Create locations (Egyptian cities)
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

  // Create admin user
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

  // Create city admin for each location
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

  // Create sample employees
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

  // Create sample suppliers
  for (const city of cities) {
    await prisma.supplier.create({
      data: { name: `الرضا للمقاولات - ${city.name}`, phone: "01xxxxxxxxx", address: city.address ?? "", locationId: city.id },
    });
    await prisma.supplier.create({
      data: { name: `النيل للتوريدات - ${city.name}`, phone: "01xxxxxxxxx", address: city.address ?? "", locationId: city.id },
    });
  }

  // Create sample inventory items
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

  console.log(`✅ Seed completed. Default password for all users: ${DEFAULT_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
