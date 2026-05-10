"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginForm) {
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="w-full max-w-md space-y-6 rounded-xl border bg-card p-8 shadow-lg relative animate-fade-in" style={{ animationDelay: "0ms" }}>
        <div className="text-center space-y-2 animate-slide-up" style={{ animationDelay: "80ms" }}>
          <h1 className="text-2xl font-bold">جلال عثمان للمقاولات</h1>
          <p className="text-sm text-muted-foreground">تسجيل الدخول إلى النظام المحاسبي</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2 animate-fade-in" style={{ animationDelay: "150ms" }}>
            <label className="text-sm font-medium">البريد الإلكتروني</label>
            <input
              type="email"
              {...register("email")}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:scale-[1.01]"
              placeholder="admin@jalal-eg.com"
            />
            {errors.email && (
              <p className="text-xs text-destructive animate-error-in">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2 animate-fade-in" style={{ animationDelay: "220ms" }}>
            <label className="text-sm font-medium">كلمة المرور</label>
            <input
              type="password"
              {...register("password")}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:scale-[1.01]"
            />
            {errors.password && (
              <p className="text-xs text-destructive animate-error-in">
                {errors.password.message}
              </p>
            )}
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive overflow-hidden animate-error-in">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all duration-200 hover:bg-primary/90 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                جاري التسجيل...
              </span>
            ) : (
              "تسجيل الدخول"
            )}
          </button>
        </form>
      </div>
    </div>
  );
