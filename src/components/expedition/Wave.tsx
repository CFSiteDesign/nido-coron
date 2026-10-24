import { cn } from "@/lib/utils";

// Soft section break in the TIDE style. Sits at the bottom of a section and is
// filled with the colour of the section that follows.
export function Wave({
  fill,
  className,
  flip = false,
}: {
  fill: string;
  className?: string;
  flip?: boolean;
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      className={cn("block h-[56px] w-full md:h-[110px]", flip && "-scale-x-100", className)}
    >
      <path d="M0 64 C 240 6 470 4 720 46 C 980 90 1210 118 1440 54 V120 H0 Z" fill={fill} />
    </svg>
  );
}
