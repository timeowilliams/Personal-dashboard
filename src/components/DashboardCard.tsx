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

const DashboardCard = ({
  title,
  value,
  icon,
  additionalInfo,
  status,
  goalValue,
}) => {
  // Determine status color based on value and goal
  const getStatusColor = () => {
    if (!status) return "bg-gray-100 dark:bg-gray-800";

    switch (status) {
      case "good":
        return "bg-emerald-100 dark:bg-emerald-900/30";
      case "warning":
        return "bg-amber-100 dark:bg-amber-900/30";
      case "bad":
        return "bg-rose-100 dark:bg-rose-900/30";
      default:
        return "bg-gray-100 dark:bg-gray-800";
    }
  };

  return (
    <Tooltip content={getTooltipContent(title, goalValue)}>
      <Card
        className={`overflow-hidden transition-all hover:shadow-lg ${getStatusColor()}`}
      >
        <div className="absolute right-0 top-0 w-20 h-20 backdrop-blur-sm rounded-full -translate-y-1/2 translate-x-1/2 opacity-30 bg-gradient-to-br from-white/30 to-white/10"></div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className="rounded-full p-2 backdrop-blur-sm bg-white/10">
            {icon}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {additionalInfo && (
            <div className="text-sm text-muted-foreground">
              {additionalInfo}
            </div>
          )}
          {goalValue && (
            <div className="mt-2 h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
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
