import logo from "@/assets/brcar-logo.png";
import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  showName = true,
  tone = "light",
}: {
  className?: string;
  showName?: boolean;
  tone?: "light" | "dark";
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <img src={logo} alt="BR Car Seminovos" className="h-9 w-auto" />
      {showName ? (
        <span className="leading-none">
          <span
            className={cn(
              "block font-display text-base font-extrabold tracking-tight",
              tone === "light" ? "text-foreground" : "text-ink-foreground",
            )}
          >
            BR CAR
          </span>
          <span className="block text-[0.65rem] font-semibold tracking-[0.2em] text-primary">
            SEMINOVOS
          </span>
        </span>
      ) : null}
    </span>
  );
}
