export function LoadingSpinner({ text = "กำลังโหลด Eater Egg Fresh Mart..." }: { text?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)] text-[var(--color-text)] font-sans relative overflow-hidden">
      {/* Subtle Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[var(--color-amber-glow)]/20 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

      <div className="flex flex-col items-center gap-3 p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-md relative z-10">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-amber-500 border-t-transparent" />
        <p className="text-xs sm:text-sm font-semibold text-[var(--color-text)]">{text}</p>
      </div>
    </div>
  );
}

export default function Loading() {
  return <LoadingSpinner />;
}
