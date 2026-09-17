export function BrandLogo({
  size = 36,
  showText = false,
  subtitle = "",
  isDark = false,
}: {
  size?: number;
  showText?: boolean;
  subtitle?: string;
  isDark?: boolean;
}) {
  return (
    <div className="inline-flex items-center gap-3 select-none">
      <div
        style={{ width: size, height: size }}
        className="rounded-full shrink-0 relative overflow-hidden shadow-md ring-2 ring-amber-400/60 bg-[#2B1413] flex items-center justify-center"
      >
        <img
          src="/logo.png"
          alt="Eater Egg Fresh Mart Logo"
          className="w-full h-full object-cover rounded-full"
        />
      </div>
      {showText && (
        <div className="text-left">
          <div className="flex items-center gap-2">
            <span
              className={`font-extrabold tracking-tight text-base sm:text-lg ${
                isDark ? "text-white" : "text-[#2B1413]"
              }`}
            >
              Eater Egg
            </span>
            <span className="text-[10px] sm:text-[11px] font-extrabold text-[#2B1413] tracking-wide uppercase px-2 py-0.5 rounded-full bg-amber-300 border border-amber-400 shadow-2xs">
              Fresh Mart
            </span>
          </div>
          {subtitle ? (
            <p className={`text-[11px] font-medium ${isDark ? "text-amber-200/80" : "text-[#78483B]"}`}>
              {subtitle}
            </p>
          ) : (
            <p className={`text-[11px] font-medium ${isDark ? "text-amber-200/80" : "text-[#78483B]"}`}>
              ระบบบริหารและบันทึกการปฏิบัติงานประจำกะ
            </p>
          )}
        </div>
      )}
    </div>
  );
}
