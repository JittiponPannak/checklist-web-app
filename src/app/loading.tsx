export function LoadingSpinner({ text = "กำลังโหลด Eater Egg Fresh Mart..." }: { text?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100 font-sans relative overflow-hidden">
      {/* Subtle Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

      <div className="flex flex-col items-center gap-3 p-6 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl relative z-10">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-indigo-500 border-t-transparent" />
        <p className="text-xs sm:text-sm font-semibold text-slate-300">{text}</p>
      </div>
    </div>
  );
}

export default function Loading() {
  return <LoadingSpinner />;
}


