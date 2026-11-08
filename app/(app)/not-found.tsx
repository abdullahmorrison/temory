import Link from "next/link";
import { TemoryMark } from "@/components/temory-mark";

/** Shown for a URL that matches nothing, or a person or moment that's gone, inside the app's nav. */
export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100dvh-7rem)] flex-col items-center justify-center px-7 text-center desk:min-h-dvh">
      <TemoryMark size={64} className="opacity-60" />
      <h1 className="mt-7 font-serif text-[1.625rem]">Nothing here</h1>
      <p className="mt-2 max-w-[19rem] text-sm leading-normal text-muted desk:max-w-[21rem]">
        This page doesn&apos;t exist. If it was a person or a moment, it may have been deleted.
      </p>
      <Link href="/people" className="mt-6 rounded-full bg-accent px-6 py-3 text-sm font-medium text-on-accent transition hover:brightness-110 active:scale-[0.98]">
        Go to people
      </Link>
    </div>
  );
}
