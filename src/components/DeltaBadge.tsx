import { formatPct } from "../lib/format";

interface DeltaBadgeProps {
  delta: number | null | undefined;
}

export const DeltaBadge = ({ delta }: DeltaBadgeProps) => {
  if (delta === null || delta === undefined || Number.isNaN(delta)) {
    return <span className="delta-badge delta-neutral">-</span>;
  }

  const cls = delta > 0 ? "delta-positive" : delta < 0 ? "delta-negative" : "delta-neutral";
  const prefix = delta > 0 ? "+" : "";

  return (
    <span className={`delta-badge ${cls}`}>
      {prefix}
      {formatPct(delta)}
    </span>
  );
};
