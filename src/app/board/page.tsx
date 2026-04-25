"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RequireAuth } from "@/components/require-auth";
import { useAuth } from "@/components/auth-provider";

function BoardRouteEntry() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    router.replace(`/board/${user.uid}`);
  }, [router, user]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-16 font-sans text-zinc-600 dark:bg-zinc-950 dark:text-zinc-400">
      <p className="text-sm">Opening your board…</p>
    </main>
  );
}

export default function BoardPage() {
  return (
    <RequireAuth>
      <BoardRouteEntry />
    </RequireAuth>
  );
}
