"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { userNeedsEmailVerification } from "@/lib/auth-client";
import { VerifyEmailGate } from "@/components/verify-email-gate";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname() || "/dashboard";

  useEffect(() => {
    if (loading || user) return;
    const from = pathname && pathname !== "/login" ? pathname : "/dashboard";
    router.replace(`/login?from=${encodeURIComponent(from)}`);
  }, [loading, user, router, pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
        <p className="text-sm">Checking session…</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (userNeedsEmailVerification(user)) {
    return <VerifyEmailGate user={user} continuePath={pathname} />;
  }

  return <>{children}</>;
}
