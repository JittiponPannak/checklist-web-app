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
    <div className="inline-flex items-center gap-3 select-none shrink-0">
      <div
        style={{ width: size, height: size }}
        className="rounded-full shrink-0 relative overflow-hidden shadow-md ring-2 ring-amber-400/80 ring-offset-1 ring-offset-[var(--color-background)] bg-[var(--color-brown)] flex items-center justify-center"
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
              className={`font-extrabold tracking-tight text-base sm:text-lg ${isDark ? "text-amber-100" : "text-[var(--color-text)]"}`}
            >
              Eater Egg
            </span>
            <span className="text-[11px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-500 text-[#2b1413] border border-amber-600 shadow-2xs">
              Fresh Mart
            </span>
          </div>
          <p className={`text-[11px] font-medium ${isDark ? "text-amber-200/80" : "text-[var(--color-text-muted)]"}`}>
            {subtitle || "ระบบตรวจเช็คลิสต์และมาตรฐานการปฏิบัติงานสาขา"}
          </p>
        </div>
      )}
    </div>
  );
}
