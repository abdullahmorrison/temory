import { LogOut } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { signOutAction } from "@/app/(auth)/actions";
import { AccountAvatar } from "@/components/account-avatar";
import { BackLink } from "@/components/back-link";
import { SectionLabel } from "@/components/section-label";
import { currentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Account · Temory" };

async function Account() {
  await connection(); // reads the cookie per request
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  return (
    <>
      <div className="mt-7 flex items-center gap-4">
        <AccountAvatar name={user.name} size="lg" />
        <div className="min-w-0">
          <p className="truncate text-[1.0625rem] font-medium">{user.name}</p>
          <p className="truncate text-[0.8125rem] text-muted">{user.email}</p>
        </div>
      </div>
      <section className="mt-8">
        <SectionLabel className="mb-3">Profile</SectionLabel>
        <dl className="divide-y divide-line rounded-xl bg-surface text-sm">
          {[
            ["Name", user.name],
            ["Email", user.email],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-4 px-4 py-3.5">
              <dt>{label}</dt>
              <dd className="truncate text-muted">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <form action={signOutAction} className="mt-8">
        <button className="flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-medium transition-colors hover:border-muted hover:bg-surface">
          <LogOut size="1rem" />
          Sign out
        </button>
      </form>
    </>
  );
}

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-xl px-7 pt-14 pb-10 desk:pt-8">
      <BackLink href="/settings" label="Back to settings" everywhere />
      <h1 className="mt-6 text-2xl font-medium desk:text-[1.75rem]">Account</h1>
      <Suspense>
        <Account />
      </Suspense>
    </div>
  );
}
