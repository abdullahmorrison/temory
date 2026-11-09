import { initials } from "@/lib/names";

/** Your own initials in a circle, for Settings and the Account page. */
export function AccountAvatar({ name, size }: { name: string; size: "md" | "lg" }) {
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full bg-clay font-serif text-clay-ink ${size === "lg" ? "size-16 text-[1.375rem]" : "size-9 text-sm"}`}
    >
      {initials(name)}
    </span>
  );
}
