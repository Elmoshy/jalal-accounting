# PROJECT_MAP — jalal-accounting

> آخر تحديث: 2026-05-10 | Surgical Fixes Batch

---

## التغييرات الجراحية التي تمت

| الإصلاح | الملفات المتأثرة | الحالة |
|---------|------------------|--------|
| 1. ترقية `next.config.mjs` — إزالة `experimental.serverActions` (مستقر في Next.js 16)، استبدال `images.domains` → `remotePatterns`، إضافة `turbopack.root` | `next.config.mjs` | ✅ |
| 2. إنشاء `types/next-auth.d.ts` — كتابة أنواع مخصصة لـ NextAuth (role, locationId, id) لإزالة كل `as any` | `types/next-auth.d.ts` + 5 ملفات استفادت | ✅ |
| 3. إزالة `as any` من `auth.ts`، `dashboard/page.tsx`، `users/page.tsx`، `locations/page.tsx` | 4 ملفات | ✅ |
| 4. إصلاح `middleware.ts` — API routes ترجع JSON بدل redirect عند عدم المصادقة | `middleware.ts` | ✅ |
| 5. إزالة `ChevronDown` غير المستخدم من `layout.tsx` | `src/app/(dashboard)/layout.tsx` | ✅ |
| 6. تعديل `Toaster position` → `top-right` (لـ RTL) | `src/components/shared/providers.tsx` | ✅ |
| 7. إزالة `public/images/`، `src/app/api/auth/login/` (فارغة) | 2 مجلدات | ✅ |
| 8. تعميم `[YOUR-PROJECT-ID]` في `.env.example` بدل ID حقيقي | `.env.example` | ✅ |
| 9. إصلاح `prisma/schema.prisma` — إضافة `datasource db { provider = "postgresql" }` + إصلاح `Project.location` → `Project.projectLocation` | `prisma/schema.prisma` | ✅ |
| 10. ترقية `package.json` — إزالة `prisma.seed` (منقول لـ `prisma.config.ts`) | `package.json` | ✅ |

---

## المشاكل المتبقية (ORPHANS & PENDING)

| المشكلة | الخطورة | خطة المعالجة |
|---------|---------|--------------|
| `[YOUR-PASSWORD]` في `.env` لم يتم استبداله | **حرجة** | يلزم المستخدم وضع باسورد Supabase الحقيقي |
| جميع `@radix-ui/*` مثبتة كـ `"latest"` | **عالية** | تثبيت الإصدارات بعد أول `npm install` ناجح |
| لا يوجد `loading.tsx` أو `error.tsx` | **متوسطة** | إضافتهما بعد M2 |
| لا يوجد CSRF على API routes | **متوسطة** | إضافة بعد M2 |
| لا يوجد Rate limiting على Login | **متوسطة** | إضافة بعد M3 |
| مجلدات `src/components/forms/`، `src/components/tables/`، `src/components/charts/` | **منخفضة** | ستنشأ عند الحاجة |
