import { initials } from "@/lib/org";

const SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-20 w-20 text-2xl",
} as const;

export function Avatar({
  name,
  className = "bg-slate-700 text-white",
  size = "md",
}: {
  name: string;
  className?: string;
  size?: keyof typeof SIZES;
}) {
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${SIZES[size]} ${className}`}
    >
      {initials(name)}
    </span>
  );
}
