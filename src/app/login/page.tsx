import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";

/** S-01 — Đăng nhập. Supabase Auth email + password, 1 admin / tòa nhà. */
export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
