import type { Metadata } from "next";
import { Suspense } from "react";
import { signInAction } from "@/app/(auth)/actions";
import { AuthHeading } from "@/app/(auth)/heading";
import { SignedOut } from "@/app/(auth)/signed-out";
import { AuthForm } from "@/components/auth-form";
import { MIN_PASSWORD_LENGTH } from "@/lib/password";

export const metadata: Metadata = { title: "Sign in · Temory" };

export default function SignInPage() {
  return (
    <>
      <AuthHeading title="Sign in">Welcome back.</AuthHeading>
      <Suspense>
        <SignedOut>
          <AuthForm action={signInAction} kind="sign-in" minLength={MIN_PASSWORD_LENGTH} />
        </SignedOut>
      </Suspense>
    </>
  );
}
