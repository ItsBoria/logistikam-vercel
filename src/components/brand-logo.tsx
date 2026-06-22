import { cn } from "@/lib/utils";

export function BrandLogo({ className, size = 64 }: { className?: string; size?: number }) {
  return (
    <img
      src="/logistikam-logo.png"
      alt="LogistikaM"
      width={size}
      height={size}
      className={cn("inline-block select-none", className)}
      style={{ width: size, height: size }}
      draggable={false}
    />
  );
}
