type AllDoneProps = {
  judgedCount: number;
};

export function AllDone({ judgedCount }: AllDoneProps) {
  return (
    <section className="j-all-done" aria-live="polite">
      <h2 className="text-2xl font-semibold tracking-tight text-[var(--j-ink)]">
        You&apos;re done
      </h2>
      <p className="mt-2 text-lg text-[var(--j-muted)]">
        {judgedCount} project{judgedCount === 1 ? "" : "s"} judged this round. Head back to
        the organizer desk if you need anything else.
      </p>
    </section>
  );
}
