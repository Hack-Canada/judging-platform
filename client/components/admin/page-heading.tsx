// Shared heading for admin pages — brand navy title in Figtree with a muted
// subtitle, so every admin screen reads as one polished system.
export function AdminPageHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="[font-family:var(--font-figtree)] text-2xl font-black tracking-tight text-[var(--brand-secondary)]">
        {title}
      </h2>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p>
    </div>
  );
}
