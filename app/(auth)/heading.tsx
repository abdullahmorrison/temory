/** The page's title and the line under it. */
export function AuthHeading({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-7">
      <h1 className="text-[1.75rem] font-medium">{title}</h1>
      <p className="-mb-2 text-[0.8125rem] text-muted">{children}</p>
    </div>
  );
}
