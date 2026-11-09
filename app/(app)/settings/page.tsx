import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { AccountAvatar } from "@/components/account-avatar";
import { BackLink } from "@/components/back-link";
import { SectionLabel } from "@/components/section-label";
import { ThemePicker } from "@/components/theme";
import { currentUser } from "@/lib/session";

/** You, as a row that opens your account. */
async function AccountRow() {
  await connection(); // reads the cookie per request
  const user = await currentUser();
  if (!user) return null;
  return (
    <Link href="/settings/account" className="flex items-center gap-3 rounded-xl bg-surface px-3.5 py-3 transition-colors hover:bg-surface/70">
      <AccountAvatar name={user.name} size="md" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">{user.name}</span>
        <span className="truncate text-xs text-muted">{user.email}</span>
      </span>
      <ChevronRight size="1.125rem" className="text-muted" />
    </Link>
  );
}

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-xl px-7 pt-14 pb-10 desk:pt-8">
      <BackLink href="/people" label="Back to people" />
      <h1 className="mt-6 text-2xl font-medium desk:mt-0 desk:text-[1.75rem]">Settings</h1>
      <section className="mt-10">
        <SectionLabel className="mb-3">Account</SectionLabel>
        <Suspense>
          <AccountRow />
        </Suspense>
      </section>
      <section className="mt-8">
        <SectionLabel className="mb-3">Appearance</SectionLabel>
        <ThemePicker />
      </section>
    </div>
  );
}
