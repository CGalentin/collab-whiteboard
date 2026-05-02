"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { LandingPage } from "@/components/landing-page";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading || !user) return;
    router.replace("/dashboard");
  }, [loading, user, router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50 to-white px-6 py-16 font-sans text-zinc-600 dark:from-emerald-950 dark:to-zinc-950 dark:text-zinc-400">
        <p className="text-sm">Checking session…</p>
      </main>
    );
  }

  if (user) {
    return null;
  }

  return <LandingPage />;
}
