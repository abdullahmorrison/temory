import { FloatingLogButton, Sidebar, TabBar } from "@/components/nav";
import { NavStack } from "@/components/nav-stack";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <main className="min-w-0 flex-1 pb-28 desk:pb-0">{children}</main>
      <FloatingLogButton />
      <TabBar />
      <NavStack />
    </div>
  );
}
