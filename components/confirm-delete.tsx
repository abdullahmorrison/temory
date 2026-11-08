"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { close } from "@/components/nav-stack";

/** Two-step delete: the first tap asks, the second deletes and closes to where the action says. */
export function ConfirmDelete({ label, warning, action }: { label: string; warning: string; action: () => Promise<{ done: string }> }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return (
      <button onClick={() => setConfirming(true)} className="text-sm text-muted underline-offset-4 hover:text-accent hover:underline">
        {label}
      </button>
    );
  }
  return (
    <form action={async () => close(router, (await action()).done, { refresh: true })} className="flex flex-wrap items-center gap-3 text-sm">
      <span>{warning}</span>
      <button className="rounded-full bg-accent px-4 py-2 font-medium text-on-accent transition hover:brightness-110">Delete</button>
      <button type="button" onClick={() => setConfirming(false)} className="text-muted hover:text-ink">
        Cancel
      </button>
    </form>
  );
}
