// utils/metricsEvaluator.js
export const evaluateMetric = (metricName, value) => {
  // Return status: "good", "warning", "bad" or null
  if (!value) return null;

  const numValue = parseFloat(value);

  switch (metricName) {
    case "sleep":
      if (numValue >= 7.5) return "good";
      if (numValue >= 6.5) return "warning";
      return "bad";

    case "protein":
      if (numValue >= 120) return "good";
      if (numValue >= 100) return "warning";
      return "bad";

    case "waist":
      if (numValue <= 29) return "good";
      if (numValue <= 31) return "warning";
      return "bad";

    case "bodyFat":
      if (numValue <= 13) return "good";
      if (numValue <= 15) return "warning";
      return "bad";

    case "water":
      if (numValue >= 91) return "good";
      if (numValue >= 64) return "warning";
      return "bad";

    case "deepWork":
      if (numValue >= 4) return "good";
      if (numValue >= 2) return "warning";
      return "bad";

    case "steps":
      if (numValue >= 8000) return "good";
      if (numValue >= 5000) return "warning";
      return "bad";

    case "fat":
      if (numValue >= 60) return "good";
      if (numValue >= 40) return "warning";
      return "bad";

    default:
      return null;
  }
};

export const getGoalValue = (metricName) => {
  switch (metricName) {
    case "sleep":
      return 8;
    case "protein":
      return 120;
    case "waist":
      return 29;
    case "bodyFat":
      return 13;
    case "water":
      return 91;
    case "deepWork":
      return 4;
    case "steps":
      return 8000;
    case "fat":
      return 60;
    default:
      return null;
  }
};

// Format metrics with proper units and decimals
export const formatMetric = (value, type, decimalPlaces = 2) => {
  if (value === undefined || value === null) return "0";

  switch (type) {
    case "currency":
      return `$${parseFloat(value).toLocaleString("en-US", {
        minimumFractionDigits: 2,
      })}`;
    case "percentage":
      return `${parseFloat(value).toFixed(1)}%`;
    case "weight":
      return `${parseFloat(value).toFixed(1)} lbs`;
    case "hours":
      return `${parseFloat(value).toFixed(decimalPlaces)} hours`;
    case "steps":
      return parseFloat(value).toFixed(0).toLocaleString();
    case "distance":
      return `${parseFloat(value).toFixed(1)} in`;
    case "volume":
      return `${parseFloat(value).toFixed(decimalPlaces)} L`;
    case "calories":
      return `${parseFloat(value).toFixed(0)} kCal`;
    case "grams":
      return `${parseFloat(value).toFixed(0)} g`;
    default:
      return `${value}`;
  }
};
