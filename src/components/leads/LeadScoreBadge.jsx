import { calculateLeadLevel } from "@/utils/leadScore";

export default function LeadScoreBadge({ score }) {
  const level = calculateLeadLevel(score);

  return (
    <span className={`lead-score-badge ${level}`}>
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </span>
  );
}

