// components/DashboardCard.jsx
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tooltip } from "./Tooltip";

// Define a type for the metrics that have goals
type MetricWithGoal =
  | "Sleep"
  | "Protein"
  | "Waist Circumference"
  | "Body Fat"
  | "Water Intake"
  | "Deep Work";

// Define the goal descriptions
const GOAL_DESCRIPTIONS: Record<MetricWithGoal, string> = {
  Sleep: " hours (7.5+ hours is good)",
  Protein: "g (100+ grams is good)",
  "Waist Circumference": "in (Goal is around 30 inches)",
  "Body Fat": "% (Target 13%, up to 15% is acceptable)",
  "Water Intake": "L (3+ liters is good)",
  "Deep Work": "hours (4+ hours is ideal)",
};

const getTooltipContent = (title: string, goalValue: number | null) => {
  if (!goalValue) return null;

  const baseContent = `Goal: ${goalValue}`;

  // Type guard to check if the title is a valid metric with goal
  if (title in GOAL_DESCRIPTIONS) {
    const metric = title as MetricWithGoal;
    return `${baseContent}${GOAL_DESCRIPTIONS[metric]}`;
  }

  return baseContent;
};

interface DashboardCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  additionalInfo?: string | null;
  status?: string | null;
  goalValue: number | null;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  icon,
  additionalInfo,
  status,
  goalValue,
}) => {
  // Get left border color for status indication
  const getStatusBorder = () => {
    if (!status) return "";

    switch (status) {
      case "good":
        return "border-l-[3px] border-l-emerald-500";
      case "warning":
        return "border-l-[3px] border-l-amber-500";
      case "bad":
        return "border-l-[3px] border-l-rose-500";
      default:
        return "";
    }
  };

  const getCardStyle = () => {
    const baseStyle =
      "relative overflow-hidden backdrop-blur-md border border-white/30 hover:shadow-lg transition-all";

    if (!status) return `${baseStyle} bg-white/10 dark:bg-gray-900/40`;

    switch (status) {
      case "good":
        return `${baseStyle} bg-gradient-to-br from-black/20 to-emerald-900/30`;
      case "warning":
        return `${baseStyle} bg-gradient-to-br from-black/20 to-amber-900/30`;
      case "bad":
        return `${baseStyle} bg-gradient-to-br from-black/20 to-rose-900/30`;
      default:
        return `${baseStyle} bg-white/10 dark:bg-gray-900/40`;
    }
  };

  return (
    <Tooltip content={getTooltipContent(title, goalValue)}>
      <Card className={`${getCardStyle()} ${getStatusBorder()}`}>
        {/* Decorative element for glassmorphism effect */}
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl bg-white/20 dark:bg-white/5 pointer-events-none"></div>

        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-5">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {title}
          </CardTitle>
          <div className="h-8 w-8 rounded-full bg-white/30 dark:bg-gray-700/30 backdrop-blur-sm flex items-center justify-center">
            {icon}
          </div>
        </CardHeader>
        <CardContent className="pb-5">
          <div className="text-2xl font-light">{value}</div>
          {additionalInfo && (
            <div className="text-xs text-gray-300 mt-1">{additionalInfo}</div>
          )}
          {goalValue > 0 && (
            <div className="mt-3 h-1 w-full bg-gray-200/40 dark:bg-gray-700/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-400/80 to-indigo-600/80"
                style={{
                  width: `${Math.min(
                    (parseFloat(value) / parseFloat(goalValue)) * 100,
                    100
                  )}%`,
                }}
              ></div>
            </div>
          )}
        </CardContent>
      </Card>
    </Tooltip>
  );
};

export default DashboardCard;
