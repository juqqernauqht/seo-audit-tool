"use client";

interface Props {
  label: string;
  score: number;
  size?: "sm" | "md";
}

function getColor(score: number): { ring: string; text: string; bg: string } {
  if (score >= 80) return { ring: "#22c55e", text: "text-green-400", bg: "bg-green-500/10" };
  if (score >= 60) return { ring: "#eab308", text: "text-yellow-400", bg: "bg-yellow-500/10" };
  return { ring: "#ef4444", text: "text-red-400", bg: "bg-red-500/10" };
}

export default function ScoreCard({ label, score, size = "md" }: Props) {
  const { ring, text, bg } = getColor(score);
  const r = size === "md" ? 28 : 22;
  const cx = size === "md" ? 36 : 28;
  const viewSize = size === "md" ? 72 : 56;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - score / 100);

  return (
    <div className={`card flex items-center gap-3 ${bg}`}>
      <svg
        width={viewSize}
        height={viewSize}
        viewBox={`0 0 ${viewSize} ${viewSize}`}
        className="-rotate-90 shrink-0"
      >
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke="#1f2937"
          strokeWidth={size === "md" ? 5 : 4}
        />
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke={ring}
          strokeWidth={size === "md" ? 5 : 4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div>
        <div className={`text-xl font-bold ${text}`}>{score}</div>
        <div className="text-gray-400 text-xs">{label}</div>
      </div>
    </div>
  );
}
