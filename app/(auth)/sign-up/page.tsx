import type { Metadata } from "next";
import { Suspense } from "react";
import { createAccountAction } from "@/app/(auth)/actions";
import { AuthHeading } from "@/app/(auth)/heading";
import { SignedOut } from "@/app/(auth)/signed-out";
import { AuthForm } from "@/components/auth-form";
import { MIN_PASSWORD_LENGTH } from "@/lib/password";

export const metadata: Metadata = { title: "Create account · Temory" };

export default function SignUpPage() {
  return (
    <>
      <AuthHeading title="Create account">Keep track of the people in your life, and the moments you share.</AuthHeading>
      <Suspense>
        <SignedOut>
          <AuthForm action={createAccountAction} kind="create" minLength={MIN_PASSWORD_LENGTH} />
        </SignedOut>
      </Suspense>
    </>
  );
}
