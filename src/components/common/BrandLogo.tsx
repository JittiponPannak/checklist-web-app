export function BrandLogo({
  size = 36,
  showText = false,
  subtitle = "",
  isDark = false,
  hideTextOnMobile = false,
}: {
  size?: number;
  showText?: boolean;
  subtitle?: string;
  isDark?: boolean;
  hideTextOnMobile?: boolean;
}) {
  return (
    <div className="inline-flex items-center gap-2.5 sm:gap-3 select-none shrink-0">
      <div
        style={{ width: size, height: size }}
        className="rounded-full shrink-0 relative overflow-hidden shadow-md ring-2 ring-amber-400/60 bg-[var(--color-brown)] flex items-center justify-center"
      >
        <img
          src="/logo.png"
          alt="Eater Egg Fresh Mart Logo"
          className="w-full h-full object-cover rounded-full"
        />
      </div>
      {showText && (
        <div className={`text-left ${hideTextOnMobile ? "hidden sm:block" : ""}`}>
          <div className="flex items-center gap-2">
            <span
              className={`font-extrabold tracking-tight text-base sm:text-lg ${isDark ? "text-[var(--color-brown)]" : "text-[var(--color-text)]"
                }`}
            >
              Eater Egg
            </span>
            <span className="text-[10px] sm:text-[11px] font-extrabold text-[var(--color-background)] tracking-wide uppercase px-2 py-0.5 rounded-full bg-[var(--color-amber)] border border-[var(--color-amber-dim)] shadow-2xs">
              Fresh Mart
            </span>
          </div>
          {subtitle ? (
            <p className={`text-[11px] font-medium ${isDark ? "text-amber-200/80" : "text-[var(--color-text-muted)]"}`}>
              {subtitle}
            </p>
          ) : (
            <p className={`text-[11px] font-medium ${isDark ? "text-amber-200/80" : "text-[var(--color-text-muted)]"}`}>
              ระบบบริหารและบันทึกการปฏิบัติงานประจำกะ
            </p>
          )}
        </div>
      )}
    </div>
  );
}
