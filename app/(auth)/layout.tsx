/** Sign in and Create account: on their own, with no tabs or sidebar, since the app is behind them. */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return <main className="mx-auto flex min-h-dvh w-full max-w-[25rem] flex-col gap-7 px-7 pt-15 pb-10 desk:justify-center desk:px-0 desk:pt-0 desk:pb-20">{children}</main>;
}
