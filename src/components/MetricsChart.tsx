import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, CalendarDays } from "lucide-react";

interface MetricsChartProps {
  data: {
    date: string;
    sleep?: number;
    deepWork?: number;
    waistCircumference?: number;
    bodyFat?: number;
    steps?: number;
  }[];
  title: string;
  metric: "sleep" | "deepWork" | "waistCircumference" | "bodyFat" | "steps";
}

const timeRanges = [
  { label: "Daily", value: "daily", icon: <Clock className="h-4 w-4" /> },
  { label: "Weekly", value: "weekly", icon: <Calendar className="h-4 w-4" /> },
  {
    label: "All Time",
    value: "all",
    icon: <CalendarDays className="h-4 w-4" />,
  },
];

const MetricsChart: React.FC<MetricsChartProps> = ({ data, title, metric }) => {
  const [timeRange, setTimeRange] = useState<"daily" | "weekly" | "all">(
    "weekly"
  );

  // Format the data based on the selected time range
  const formatData = () => {
    if (!data || data.length === 0) return [];

    const now = new Date();
    const filteredData = data.filter((item) => {
      const itemDate = new Date(item.date);
      switch (timeRange) {
        case "daily":
          return itemDate.toDateString() === now.toDateString();
        case "weekly":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return itemDate >= weekAgo;
        case "all":
          return true;
      }
    });

    return filteredData;
  };

  const getMetricColor = () => {
    switch (metric) {
      case "sleep":
        return "#3b82f6"; // blue
      case "deepWork":
        return "#10b981"; // emerald
      case "waistCircumference":
        return "#f59e0b"; // amber
      case "bodyFat":
        return "#ef4444"; // red
      case "steps":
        return "#8b5cf6"; // violet
      default:
        return "#3b82f6";
    }
  };

  const getMetricUnit = () => {
    switch (metric) {
      case "sleep":
        return "hours";
      case "deepWork":
        return "hours";
      case "waistCircumference":
        return "inches";
      case "bodyFat":
        return "%";
      case "steps":
        return "steps";
      default:
        return "";
    }
  };

  return (
    <Card className="glassmorphism-card bg-white/20 dark:bg-gray-800/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex space-x-2">
          {timeRanges.map((range) => (
            <Button
              key={range.value}
              variant={timeRange === range.value ? "default" : "ghost"}
              size="sm"
              onClick={() =>
                setTimeRange(range.value as "daily" | "weekly" | "all")
              }
              className="h-8 px-2"
            >
              {range.icon}
              <span className="ml-2">{range.label}</span>
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={formatData()}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255, 255, 255, 0.1)"
              />
              <XAxis
                dataKey="date"
                stroke="rgba(255, 255, 255, 0.5)"
                tick={{ fill: "rgba(255, 255, 255, 0.7)" }}
                tickFormatter={(date) => {
                  const d = new Date(date);
                  return timeRange === "daily"
                    ? d.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : d.toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                      });
                }}
              />
              <YAxis
                stroke="rgba(255, 255, 255, 0.5)"
                tick={{ fill: "rgba(255, 255, 255, 0.7)" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "0.5rem",
                }}
                labelStyle={{ color: "rgba(255, 255, 255, 0.7)" }}
                formatter={(value: number) => [
                  `${value} ${getMetricUnit()}`,
                  title,
                ]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey={metric}
                stroke={getMetricColor()}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricsChart;
