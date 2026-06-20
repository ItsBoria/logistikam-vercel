import { cn } from "@/lib/utils";

export function BrandLogo({ className, size = 64 }: { className?: string; size?: number }) {
  return (
    <img
      src="/logikam-logo.svg"
      alt="Logikam"
      width={size}
      height={size}
      className={cn("inline-block select-none", className)}
      style={{ width: size, height: size }}
      draggable={false}
    />
  );
}
