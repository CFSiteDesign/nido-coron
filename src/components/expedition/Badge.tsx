import monkey from "@/assets/monkey.png";
import { cn } from "@/lib/utils";

// Interim roundel in the Kuta Lombok Surf Camp badge style. The brief says the
// final logo is still to be confirmed (circular, Kuta style): swap this
// component for the real artwork when it lands.
export function Badge({
  className,
  title = "Mad Monkey Palawan Expedition",
}: {
  className?: string;
  title?: string;
}) {
  const cx = 100;
  const cy = 108;
  return (
    <svg viewBox="0 0 200 204" className={cn("block", className)} role="img" aria-label={title}>
      <defs>
        <path id="badge-top" d={`M ${cx - 70} ${cy} A 70 70 0 0 1 ${cx + 70} ${cy}`} />
        <path id="badge-bottom" d={`M ${cx - 83} ${cy} A 83 83 0 0 0 ${cx + 83} ${cy}`} />
        <clipPath id="badge-inner">
          <circle cx={cx} cy={cy} r={60} />
        </clipPath>
      </defs>
      {/* hull behind the roundel, like the surfboard on the Kuta badge */}
      <g transform={`rotate(-14 ${cx} ${cy})`}>
        <path
          d={`M ${cx - 104} ${cy + 4} Q ${cx - 40} ${cy - 22} ${cx + 104} ${cy - 2} Q ${cx + 30} ${cy + 26} ${cx - 104} ${cy + 4} Z`}
          fill="var(--midnight)"
        />
        <line
          x1={cx - 92}
          y1={cy + 20}
          x2={cx + 92}
          y2={cy + 14}
          stroke="var(--midnight)"
          strokeWidth={3}
          strokeLinecap="round"
        />
      </g>
      <circle
        cx={cx}
        cy={cy}
        r={90}
        fill="var(--powder)"
        stroke="var(--midnight)"
        strokeWidth={3.5}
      />
      <circle cx={cx} cy={cy} r={62} fill="var(--lapis)" stroke="var(--midnight)" strokeWidth={3} />
      <circle
        cx={cx}
        cy={cy}
        r={56}
        fill="var(--cream)"
        stroke="var(--midnight)"
        strokeWidth={2.5}
      />
      <g clipPath="url(#badge-inner)">
        <path
          d={`M ${cx - 70} ${cy + 34} Q ${cx - 30} ${cy + 24} ${cx} ${cy + 34} T ${cx + 70} ${cy + 34} V ${cy + 70} H ${cx - 70} Z`}
          fill="var(--powder)"
        />
      </g>
      <image href={monkey} x={cx - 43} y={cy - 44} width={86} height={75} />
      <g
        fill="var(--midnight)"
        style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          letterSpacing: "0.06em",
        }}
      >
        <text fontSize={21}>
          <textPath href="#badge-top" startOffset="50%" textAnchor="middle">
            EXPEDITION
          </textPath>
        </text>
        <text fontSize={17}>
          <textPath href="#badge-bottom" startOffset="50%" textAnchor="middle">
            MAD MONKEY
          </textPath>
        </text>
      </g>
      <rect x={cx - 50} y={2} width={100} height={20} rx={10} fill="var(--midnight)" />
      <text
        x={cx}
        y={16}
        textAnchor="middle"
        fill="var(--chartreuse)"
        fontSize={10.5}
        style={{ fontFamily: "Barlow, sans-serif", fontWeight: 800, letterSpacing: "0.12em" }}
      >
        EL NIDO · CORON
      </text>
    </svg>
  );
}
