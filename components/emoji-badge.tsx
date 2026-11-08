/**
 * A person's emoji in a small disc on the bottom-right of their avatar. The avatar must be
 * `relative`; the badge sizes itself to it, so one badge fits every avatar size.
 */
export function EmojiBadge({ emoji }: { emoji: string }) {
  if (!emoji) return null;
  return (
    <span
      aria-hidden
      className="@container absolute -right-[2%] -bottom-[2%] flex aspect-square w-[max(31%,1rem)] items-center justify-center rounded-full bg-paper ring-[1.5px] ring-halo"
    >
      <span className="font-sans text-[68cqw] leading-none">{emoji}</span>
    </span>
  );
}
