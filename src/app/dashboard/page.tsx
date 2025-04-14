"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/DashboardLayout";
import DashboardCard from "@/components/DashboardCard";
import OuraConnect from "@/components/OuraConnect";
import PlaidConnect from "@/components/PlaidConnect";
import { Card, CardContent } from "@/components/ui/card";
import {
  evaluateMetric,
  getGoalValue,
  formatMetric,
} from "@/utils/metricsEvaluator";
import {
  DollarSign,
  CreditCard,
  Brain,
  Wallet,
  Moon,
  Clock,
  Droplet,
  Flame,
  Apple,
  Beef,
  ChevronsLeft,
  Ruler,
  User,
  Footprints,
  Scale,
  Percent,
} from "lucide-react";
import {
  Account,
  BankAccount,
  HealthData,
  PostureData,
  ActivityData,
  DeepWorkData,
} from "@/types";
import { cacheUtils } from "../../utils/cache";
import MetricsChart from "@/components/MetricsChart";

interface PlaidMetadata {
  institution?: {
    name: string;
  };
}

interface PlaidAccount {
  accountId: string;
  name: string;
  balances: {
    available: number | null;
    current: number | null;
    iso_currency_code: string | null;
  };
  type: string;
  subtype: string;
}

interface HistoricalData {
  date: string;
  sleep?: number;
  deepWork?: number;
  waistCircumference?: number;
  bodyFat?: number;
  steps?: number;
}

interface Transaction {
  date: string;
  amount: number;
}

const Dashboard = () => {
  const { data: session, status } = useSession();
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [netWorth, setNetWorth] = useState(0);
  const [ouraToken, setOuraToken] = useState<string | null>(null);
  const [todayData, setTodayData] = useState<ActivityData>({});
  const [todayPosture, setTodayPosture] = useState<PostureData | null>(null);
  const [todaySpending, setTodaySpending] = useState<number>(0);
  const [todayDeepWorkHours, setTodayDeepWorkHours] = useState<number>(0);
  const [activeCategory, setActiveCategory] = useState("all");
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);

  // Define metric categories
  const metricCategories = {
    finances: ["Today's Spending", "Checking Account Balance", "Net Worth"],
    fitness: ["Activity", "Steps", "Weight", "Body Fat", "Waist Circumference"],
    nutrition: ["Calories", "Carbs", "Protein", "Fat", "Water Intake"],
    sleep: ["Sleep"],
    work: ["Deep Work", "Posture Grade"],
  };

  // Filter cards based on active category
  const shouldShowCard = (title: string): boolean => {
    if (activeCategory === "all") return true;
    return (
      metricCategories[
        activeCategory as keyof typeof metricCategories
      ]?.includes(title) || false
    );
  };

  // First, let's define which charts belong to which categories
  const chartCategories = {
    finances: [], // Currently no financial charts, but can be added later
    fitness: ["Steps", "Waist Circumference", "Body Fat Percentage"],
    sleep: ["Sleep Hours"],
    work: ["Deep Work Hours"],
  };

  // Add this helper function to check if a chart should be shown
  const shouldShowChart = (metricTitle: string): boolean => {
    if (activeCategory === "all") return true;

    return (
      chartCategories[activeCategory as keyof typeof chartCategories]?.includes(
        metricTitle
      ) || false
    );
  };

  // Fetch all data on initial load
  useEffect(() => {
    const loadData = async () => {
      if (status === "authenticated" && session?.accessToken) {
        console.log("Starting initial data load");
        setLoading(true);
        try {
          // Fetch all data in parallel
          await Promise.all([
            refreshAccountBalances(),
            fetchFinancialData(),
            fetchHealthData(),
            fetchPostureData(),
            fetchDeepWorkData(),
            fetchHistoricalData(),
          ]);
          console.log("Initial data load complete");
        } catch (error) {
          console.error("Error in initial data load:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadData();
  }, [status, session?.accessToken]);

  if (status === "loading") {
    return (
      <DashboardLayout
        title="Life Dashboard"
        loading={true}
        activeCategory="all"
        setActiveCategory={() => {}} // Empty function since it won't be used
      >
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (status === "unauthenticated") {
    return (
      <DashboardLayout
        title="Life Dashboard"
        loading={false}
        activeCategory="all"
        setActiveCategory={() => {}} // Empty function since it won't be used
      >
        <div className="glassmorphism-card p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Please log in</h2>
          <p className="mb-6">
            You need to be logged in to view your dashboard
          </p>
          <button className="px-4 py-2 bg-blue-500 text-white rounded-md">
            Login
          </button>
        </div>
      </DashboardLayout>
    );
  }

  // Calculate checking account balance
  const checkingBalance = accounts
    .filter((acc) => acc.type === "depository" && acc.subtype === "checking")
    .reduce((sum, acc) => sum + (acc.balances.current || 0), 0);

  const fetchDeepWorkData = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const cacheKey = `deepWork-${today}`;

      // Check cache first
      const cachedDeepWork = cacheUtils.get<DeepWorkData>(cacheKey);
      if (cachedDeepWork) {
        console.log("Using cached deep work data");
        setTodayDeepWorkHours(cachedDeepWork.totalDeepWorkHours);
        return;
      }

      const deepWorkResponse = await fetch(
        `https://backend-production-5eec.up.railway.app/api/v1/activity?date=${today}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.accessToken}`,
          },
        }
      );

      if (!deepWorkResponse.ok) {
        throw new Error(
          `Activity API failed with status ${deepWorkResponse.status}`
        );
      }

      const deepWorkData = await deepWorkResponse.json();
      cacheUtils.set(cacheKey, deepWorkData);
      setTodayDeepWorkHours(deepWorkData.totalDeepWorkHours);
    } catch (error) {
      console.error("Error fetching deep work data:", error);
      setTodayDeepWorkHours(0);
    }
  };

  const handlePlaidSuccess = async (
    publicToken: string,
    metadata: PlaidMetadata
  ) => {
    console.log("Plaid success with institution:", metadata.institution?.name);

    try {
      // Step 1: Exchange for access token
      const exchangeResponse = await fetch("/api/plaid/exchange-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_token: publicToken }),
      });

      const exchangeData = await exchangeResponse.json();
      const accessToken = exchangeData.access_token;

      // Step 2: Save or update the bank account
      const saveBankResponse = await fetch(
        "https://backend-production-5eec.up.railway.app/api/v1/financial/save-bank-account",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.accessToken}`,
          },
          body: JSON.stringify({
            accessToken: accessToken,
            institutionName: metadata.institution?.name || "Unknown Bank",
          }),
        }
      );

      if (!saveBankResponse.ok) {
        console.warn("Warning: Failed to save bank account");
      } else {
        const saveResult = await saveBankResponse.json();
        console.log("Bank account save result:", saveResult);
      }

      // Step 3: Get accounts from Plaid
      const accountsResponse = await fetch("/api/plaid/get-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: accessToken }),
      });

      const accountsData = await accountsResponse.json();

      // Step 4: Map and persist accounts
      if (accountsData.accounts && accountsData.accounts.length > 0) {
        const mappedAccounts = accountsData.accounts.map(
          (acc: PlaidAccount) => ({
            accountId: acc.accountId,
            name: acc.name,
            balances: {
              available:
                typeof acc.balances.available === "number"
                  ? acc.balances.available
                  : acc.balances.current || 0,
              current: acc.balances.current || 0,
              iso_currency_code: acc.balances.iso_currency_code || "USD",
            },
            type: acc.type,
            subtype: acc.subtype,
          })
        );

        // Persist accounts
        const persistResult = await persistAccounts(mappedAccounts);

        if (persistResult) {
          alert("Bank account connected successfully!");

          // Force page refresh to ensure we load fresh data
          window.location.reload();
        } else {
          alert(
            "Connected to bank but had trouble saving account details. Please try refreshing the page."
          );
        }
      }
    } catch (error) {
      console.error("Error in Plaid integration:", error);
      alert(
        "There was an error connecting your bank account. Please try again."
      );
    }
  };

  // Add new function to refresh balances
  const refreshAccountBalances = async () => {
    try {
      const response = await fetch("/api/plaid/refresh-balances", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to refresh balances");
      }

      const updatedAccounts = await response.json();
      console.log("Refreshed account balances:", updatedAccounts);
    } catch (error) {
      console.error("Error refreshing balances:", error);
    }
  };

  // Function to fetch financial data
  const fetchFinancialData = async () => {
    try {
      console.log(
        "Starting to fetch financial data with token:",
        session?.accessToken?.substring(0, 20) + "..."
      );

      // First, fetch bank accounts
      const bankAccountsResponse = await fetch(
        "https://backend-production-5eec.up.railway.app/api/v1/financial/bank-accounts",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.accessToken}`,
          },
        }
      );

      console.log(
        "Bank accounts response status:",
        bankAccountsResponse.status
      );

      if (bankAccountsResponse.ok) {
        const bankAccountsData = await bankAccountsResponse.json();
        console.log("Raw bank accounts data:", bankAccountsData);
        setBankAccounts(bankAccountsData.bankAccounts || []);
      }

      // Then, fetch financial data
      const financialResponse = await fetch(
        "https://backend-production-5eec.up.railway.app/api/v1/financial",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.accessToken}`,
          },
        }
      );

      console.log("Financial response status:", financialResponse.status);

      if (!financialResponse.ok) {
        throw new Error(`Financial fetch failed: ${financialResponse.status}`);
      }

      const financialData = await financialResponse.json();
      console.log("Raw financial data:", financialData);

      if (financialData.accounts && Array.isArray(financialData.accounts)) {
        console.log("Setting accounts:", financialData.accounts);
        setAccounts(financialData.accounts);

        // Calculate net worth with proper handling of credit accounts
        const calculatedNetWorth = financialData.accounts.reduce(
          (sum: number, acc: Account) => {
            const balance = acc.balances.current || 0;
            const contribution = acc.type === "credit" ? -balance : balance;

            console.log(
              `Account ${acc.name} (${acc.type}): ${
                contribution > 0 ? "+" : ""
              }${contribution}`
            );

            return sum + contribution;
          },
          0
        );
        setNetWorth(calculatedNetWorth);
      } else {
        console.warn("No accounts array in financial data:", financialData);
      }

      // Handle today's transactions for spending
      if (Array.isArray(financialData.transactions)) {
        const today = new Date().toISOString().split("T")[0];
        const todayTransactions = financialData.transactions.filter(
          (t: Transaction) => t.date?.startsWith(today)
        );
        const todaySpendingTotal = todayTransactions.reduce(
          (sum: number, t: Transaction) => sum + (t.amount || 0),
          0
        );
        setTodaySpending(todaySpendingTotal);
      }
    } catch (error) {
      console.error("Error in fetchFinancialData:", error);
    }
  };

  // Function to fetch health data
  const fetchHealthData = async () => {
    try {
      const healthResponse = await fetch(
        `https://backend-production-5eec.up.railway.app/api/v1/health`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.accessToken}`,
          },
        }
      );

      if (!healthResponse.ok) {
        throw new Error(
          `Health API failed with status ${healthResponse.status}`
        );
      }

      const healthData = await healthResponse.json();

      if (healthData.length > 0) {
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split("T")[0];

        // Find the most recent entry for today
        const todayEntry = healthData.find((entry) =>
          entry.timestamp.startsWith(today)
        );

        if (todayEntry) {
          console.log("Found today's health data:", todayEntry);
          setTodayData({
            sleep: todayEntry.sleep || 0,
            activity: (todayEntry.activity || 0) / 60,
            waterIntake: todayEntry.waterIntake || 0,
            calories: todayEntry.calories || 0,
            carbs: todayEntry.carbs || 0,
            protein: todayEntry.protein || 0,
            fat: todayEntry.fat || 0,
            steps: todayEntry.steps || 0,
            weight: todayEntry.weight || 0,
            bodyFat: todayEntry.bodyFat || 0,
            waistCircumference: todayEntry.waistCircumference || 0,
            waistDate: todayEntry.waistDate,
            weightDate: todayEntry.weightDate,
            bodyFatDate: todayEntry.bodyFatDate,
          });
        } else {
          console.log("No health data found for today");
          // Optionally, you could set default values or show a message
          setTodayData({
            sleep: 0,
            activity: 0,
            waterIntake: 0,
            calories: 0,
            carbs: 0,
            protein: 0,
            fat: 0,
            steps: 0,
            weight: 0,
            bodyFat: 0,
            waistCircumference: 0,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching health data:", error);
    }
  };

  const fetchPostureData = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const cacheKey = `postureData-${today}`;

      // Check cache first
      const cachedPosture = cacheUtils.get<PostureData>(cacheKey);
      if (cachedPosture) {
        console.log("Using cached posture data");
        setTodayPosture(cachedPosture);
        return;
      }

      const postureResponse = await fetch(
        `https://backend-production-5eec.up.railway.app/api/v1/posture?date=${today}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.accessToken}`,
          },
        }
      );

      if (!postureResponse.ok) {
        throw new Error(
          `Posture API failed with status ${postureResponse.status}`
        );
      }

      const postureData = await postureResponse.json();
      if (postureData.length > 0) {
        cacheUtils.set(cacheKey, postureData[0]);
        setTodayPosture(postureData[0]);
      }
    } catch (error) {
      console.error("Error fetching posture data:", error);
    }
  };

  const persistAccounts = async (accountsToPersist: Account[]) => {
    try {
      const existingAccountsMap = new Map();
      accountsToPersist.forEach((acc) => {
        existingAccountsMap.set(acc.accountId, acc);
      });

      const updatedAccounts = accountsToPersist.map((account) => {
        const existingAccount = existingAccountsMap.get(account.accountId);
        if (existingAccount) {
          // Update existing account
          return {
            ...existingAccount,
            balances: {
              available:
                account.balances.available ?? account.balances.current ?? 0,
              current: account.balances.current ?? 0,
              iso_currency_code: account.balances.iso_currency_code ?? "USD",
            },
          };
        }
        // Create new account
        return {
          accountId: account.accountId,
          name: account.name,
          balances: {
            available:
              account.balances.available ?? account.balances.current ?? 0,
            current: account.balances.current ?? 0,
            iso_currency_code: account.balances.iso_currency_code ?? "USD",
          },
          type: account.type,
          subtype: account.subtype,
        };
      });

      console.log("Persisting accounts with proper schema:", updatedAccounts);

      const response = await fetch(
        "https://backend-production-5eec.up.railway.app/api/v1/financial/accounts",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.accessToken}`,
          },
          body: JSON.stringify({ accounts: updatedAccounts }),
        }
      );

      const responseData = await response.json();
      console.log("Persistence response status:", response.status);
      console.log("Persistence response data:", responseData);

      if (!response.ok) {
        throw new Error(
          `Persistence failed: ${response.status} - ${
            responseData.message || "No error message"
          }`
        );
      }

      return true;
    } catch (error) {
      console.error("Persist error:", error);
      return false;
    }
  };

  const handleOuraSuccess = (token: string) => {
    setOuraToken(token);
    // Refresh health data when Oura connects
    fetchHealthData();
  };

  // Debug render
  console.log("Rendering with accounts:", accounts);
  console.log("Rendering with bankAccounts:", bankAccounts);

  // At the top of your component, define the cards configuration
  const cardConfigs = [
    {
      id: "todaySpending",
      title: "Today's Spending",
      value: todaySpending,
      format: "currency",
      icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
    },
    {
      id: "checkingBalance",
      title: "Checking Account Balance",
      value: checkingBalance,
      format: "currency",
      icon: <Wallet className="h-4 w-4 text-muted-foreground" />,
    },
    {
      id: "sleep",
      title: "Sleep",
      value: todayData.sleep,
      format: "hours",
      icon: <Moon className="h-4 w-4 text-muted-foreground" />,
      status: evaluateMetric("sleep", todayData.sleep),
      goalValue: getGoalValue("sleep") || 0,
    },
    {
      id: "activity",
      title: "Activity",
      value: todayData.activity,
      format: "hours",
      icon: <Clock className="h-4 w-4 text-muted-foreground" />,
    },
    {
      id: "steps",
      title: "Steps",
      value: todayData.steps,
      format: "steps",
      icon: <Footprints className="h-4 w-4 text-muted-foreground" />,
      status: evaluateMetric("steps", todayData.steps),
      goalValue: getGoalValue("steps") || 0,
    },
    {
      id: "waterIntake",
      title: "Water Intake",
      value: todayData.waterIntake,
      format: "volume",
      icon: <Droplet className="h-4 w-4 text-muted-foreground" />,
      status: evaluateMetric("water", todayData.waterIntake),
      goalValue: getGoalValue("water") || 0,
    },
    {
      id: "calories",
      title: "Calories",
      value: todayData.calories,
      format: "calories",
      icon: <Flame className="h-4 w-4 text-muted-foreground" />,
    },
    {
      id: "carbs",
      title: "Carbs",
      value: todayData.carbs,
      format: "grams",
      icon: <Apple className="h-4 w-4 text-muted-foreground" />,
    },
    {
      id: "protein",
      title: "Protein",
      value: todayData.protein,
      format: "grams",
      icon: <Beef className="h-4 w-4 text-muted-foreground" />,
      status: evaluateMetric("protein", todayData.protein),
      goalValue: getGoalValue("protein") || 0,
    },
    {
      id: "fat",
      title: "Fat",
      value: todayData.fat,
      format: "grams",
      icon: <ChevronsLeft className="h-4 w-4 text-muted-foreground" />,
      status: evaluateMetric("fat", todayData.fat),
      goalValue: getGoalValue("fat") || 0,
    },
    {
      id: "waistCircumference",
      title: "Waist Circumference",
      value: todayData.waistCircumference,
      format: "distance",
      icon: <Ruler className="h-4 w-4 text-muted-foreground" />,
      status: evaluateMetric("waist", todayData.waistCircumference),
      goalValue: getGoalValue("waist") || 0,
    },
    {
      id: "weight",
      title: "Weight",
      value: todayData.weight ? todayData.weight * 2.20462 : 0,
      format: "weight",
      icon: <Scale className="h-4 w-4 text-muted-foreground" />,
      status: evaluateMetric("weight", todayData.weight),
      goalValue: getGoalValue("weight") || 0,
    },
    {
      id: "bodyFat",
      title: "Body Fat",
      value: todayData.bodyFat,
      format: "percentage",
      icon: <Percent className="h-4 w-4 text-muted-foreground" />,
      status: evaluateMetric("bodyFat", todayData.bodyFat),
      goalValue: getGoalValue("bodyFat") || 0,
    },
    {
      id: "postureGrade",
      title: "Posture Grade",
      value: todayPosture ? todayPosture.grade : "N/A",
      icon: <User className="h-4 w-4 text-muted-foreground" />,
      status: todayPosture
        ? evaluateMetric("posture", todayPosture.score)
        : null,
      goalValue: getGoalValue("posture") || 0,
    },
    {
      id: "deepWork",
      title: "Deep Work",
      value: todayDeepWorkHours,
      format: "hours",
      icon: <Brain className="h-4 w-4 text-muted-foreground" />,
      status: evaluateMetric("deepWork", todayDeepWorkHours),
      goalValue: getGoalValue("deepWork") || 0,
    },
    {
      id: "netWorth",
      title: "Net Worth",
      value: netWorth,
      format: "currency",
      icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
    },
  ];

  // Add new function to fetch historical data
  const fetchHistoricalData = async () => {
    try {
      const response = await fetch(
        "https://backend-production-5eec.up.railway.app/api/v1/health/history",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`History API failed with status ${response.status}`);
      }

      const data = await response.json();
      setHistoricalData(data);
    } catch (error) {
      console.error("Error fetching historical data:", error);
    }
  };

  return (
    <DashboardLayout
      title="Life Dashboard"
      loading={loading}
      activeCategory={activeCategory}
      setActiveCategory={setActiveCategory}
    >
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cardConfigs.map(
          (config) =>
            shouldShowCard(config.title) && (
              <DashboardCard
                key={config.id}
                title={config.title}
                value={formatMetric(config.value, config.format)}
                icon={config.icon}
                status={config.status}
                goalValue={config.goalValue || null}
              />
            )
        )}
      </div>

      {/* Add charts section */}
      <div className="mt-8 grid gap-6 grid-cols-1 lg:grid-cols-2">
        {shouldShowChart("Sleep Hours") && (
          <MetricsChart
            data={historicalData}
            title="Sleep Hours"
            metric="sleep"
          />
        )}
        {shouldShowChart("Deep Work Hours") && (
          <MetricsChart
            data={historicalData}
            title="Deep Work Hours"
            metric="deepWork"
          />
        )}
        {shouldShowChart("Waist Circumference") && (
          <MetricsChart
            data={historicalData}
            title="Waist Circumference"
            metric="waistCircumference"
          />
        )}
        {shouldShowChart("Body Fat Percentage") && (
          <MetricsChart
            data={historicalData}
            title="Body Fat Percentage"
            metric="bodyFat"
          />
        )}
        {shouldShowChart("Steps") && (
          <MetricsChart
            data={historicalData}
            title="Daily Steps"
            metric="steps"
          />
        )}
      </div>

      {(activeCategory === "all" || activeCategory === "finances") && (
        <div className="mt-6 sm:mt-10">
          {accounts.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-4 px-2 sm:px-0">
                <h2 className="text-lg font-medium">Connected Accounts</h2>
                <button className="text-xs rounded-full py-1 px-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-colors">
                  View All
                </button>
              </div>

              <div className="grid gap-3">
                {accounts.slice(0, 3).map((account) => (
                  <div
                    key={account.accountId}
                    className="flex items-center justify-between p-3 bg-white/30 dark:bg-gray-800/20 backdrop-blur-sm rounded-lg border border-white/20 dark:border-white/5 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-full bg-white/20 dark:bg-gray-700/30 backdrop-blur-sm">
                        {account.type === "credit" ? (
                          <CreditCard className="h-5 w-5" />
                        ) : (
                          <Wallet className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-sm">
                          {account.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {account.type} • {account.subtype}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="font-medium text-sm">
                        $
                        {account.balances.current?.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                      <PlaidConnect
                        onSuccess={handlePlaidSuccess}
                        buttonText="Refresh"
                        mode="update"
                        institutionName={account.name}
                        buttonClassName="text-xs rounded-full py-1 px-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-700 dark:text-gray-300"
                      />
                    </div>
                  </div>
                ))}

                {accounts.length > 3 && (
                  <button className="text-center text-xs text-indigo-500 hover:text-indigo-600 py-2">
                    Show {accounts.length - 3} more accounts
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="text-center p-6 bg-white/30 dark:bg-gray-800/20 backdrop-blur-sm rounded-lg border border-white/20 dark:border-white/5">
              <h3 className="text-lg font-medium mb-2">
                Connect Your Bank Account
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Link your bank account to track your finances and spending
              </p>
            </div>
          )}

          <div className="mt-3 flex justify-end">
            <PlaidConnect
              onSuccess={handlePlaidSuccess}
              buttonText={accounts.length > 0 ? "Add Account" : "Connect Bank"}
              buttonClassName="text-xs rounded-full py-1.5 px-4 bg-indigo-500/80 text-white hover:bg-indigo-600/80 transition-colors"
            />
          </div>
        </div>
      )}

      {(activeCategory === "all" ||
        activeCategory === "sleep" ||
        activeCategory === "fitness") && (
        <Card className="mt-6 glassmorphism-card bg-white/20 dark:bg-gray-800/20">
          <CardContent className="flex flex-col items-center justify-center p-6">
            {!ouraToken ? (
              <>
                <div className="text-center space-y-2 mb-4">
                  <h3 className="text-lg font-medium">
                    Connect Your Oura Ring
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Link your Oura Ring to see your health metrics
                  </p>
                </div>
                <OuraConnect onSuccess={handleOuraSuccess} />
              </>
            ) : (
              <OuraConnect onSuccess={handleOuraSuccess} />
            )}
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
};

export default Dashboard;
