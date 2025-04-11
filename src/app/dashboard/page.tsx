"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/DashboardLayout";
import DashboardCard from "@/components/DashboardCard";
import OuraConnect from "@/components/OuraConnect";
import PlaidConnect from "@/components/PlaidConnect";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
  Transaction,
  DeepWorkData,
} from "@/types";

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

  // Fetch all data on initial load
  useEffect(() => {
    if (status !== "authenticated") {
      console.log("Not authenticated");
      return;
    }

    console.log("Initial fetch with token:", session?.accessToken);
    fetchAllData();
  }, [status, session]);

  if (status === "loading") {
    return (
      <DashboardLayout title="Life Dashboard" loading={true}>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (status === "unauthenticated") {
    return (
      <DashboardLayout title="Life Dashboard" loading={false}>
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

      const deepWorkData: DeepWorkData = await deepWorkResponse.json();
      console.log("Activity API Response:", deepWorkData);

      setTodayDeepWorkHours(deepWorkData.totalDeepWorkHours);
    } catch (error) {
      console.error("Error fetching activity data:", error);
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

  // Function to fetch all data
  const fetchAllData = async () => {
    if (status !== "authenticated" || !session?.accessToken) {
      console.log("Not authenticated");
      return;
    }

    setLoading(true);
    try {
      // Fetch financial data
      await fetchFinancialData();

      // Fetch health data
      await fetchHealthData();

      // Fetch deep work data
      await fetchDeepWorkData();
    } catch (error) {
      console.error("Error fetching all data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch financial data
  const fetchFinancialData = async () => {
    try {
      console.log("Fetching financial data");
      const persistedResponse = await fetch(
        "https://backend-production-5eec.up.railway.app/api/v1/financial",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.accessToken}`,
          },
        }
      );

      if (!persistedResponse.ok) {
        throw new Error(`Fetch failed: ${persistedResponse.status}`);
      }

      const persistedData = await persistedResponse.json();
      console.log("GET /api/v1/financial response:", persistedData);

      // Update bank accounts
      if (persistedData.bankAccounts?.length > 0) {
        setBankAccounts(persistedData.bankAccounts);
      }

      // Update accounts
      if (persistedData.accounts?.length > 0) {
        const mappedAccounts = persistedData.accounts.map(
          (acc: PlaidAccount) => ({
            accountId: acc.accountId,
            name: acc.name,
            balances: acc.balances,
            type: acc.type,
            subtype: acc.subtype,
          })
        );
        console.log("Setting accounts from server:", mappedAccounts);
        setAccounts(mappedAccounts);

        // Calculate net worth
        const calculatedNetWorth = mappedAccounts.reduce(
          (sum: number, acc: Account) => sum + (acc.balances.current || 0),
          0
        );
        setNetWorth(calculatedNetWorth);
      }

      // Fetch today's spending
      const today = new Date().toISOString().split("T")[0];
      const financialResponse = await fetch(
        `https://backend-production-5eec.up.railway.app/api/v1/financial?date=${today}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.accessToken}`,
          },
        }
      );

      if (financialResponse.ok) {
        const financialData = await financialResponse.json();
        if (financialData.transactions) {
          const todaySpendingTotal = financialData.transactions.reduce(
            (sum: number, transaction: Transaction) => sum + transaction.amount,
            0
          );
          setTodaySpending(todaySpendingTotal);
        }
      }
    } catch (error) {
      console.error("Error fetching financial data:", error);
    }
  };

  // Function to fetch health data
  const fetchHealthData = async () => {
    try {
      // Fetch health data
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
      console.log("Health API Response:", healthData);

      if (healthData.length > 0) {
        // Sort by timestamp to get the latest entry
        const latestHealth = healthData.sort(
          (a: HealthData, b: HealthData) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )[0];

        setTodayData({
          sleep: latestHealth.sleep || 0,
          activity: (latestHealth.activity || 0) / 60, // Convert minutes to hours
          waterIntake: latestHealth.waterIntake || 0,
          calories: latestHealth.calories || 0,
          carbs: latestHealth.carbs || 0,
          protein: latestHealth.protein || 0,
          fat: latestHealth.fat || 0,
          steps: latestHealth.steps || 0,
          weight: latestHealth.weight || 0,
          bodyFat: latestHealth.bodyFat || 0,
          waistCircumference: latestHealth.waistCircumference || 0,
          waistDate: latestHealth.waistDate,
          weightDate: latestHealth.weightDate,
          bodyFatDate: latestHealth.bodyFatDate,
        });
      }

      // Fetch posture data
      const today = new Date().toISOString().split("T")[0];
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
        setTodayPosture(postureData[0]);
      }
    } catch (error) {
      console.error("Error fetching health data:", error);
    }
  };

  const persistAccounts = async (accountsToPersist: Account[]) => {
    try {
      const mappedAccounts = accountsToPersist.map((acc) => ({
        accountId: acc.accountId,
        name: acc.name,
        balances: {
          available: acc.balances.available || acc.balances.current || 0, // Ensure available is set
          current: acc.balances.current || 0,
          iso_currency_code: acc.balances.iso_currency_code || "USD",
        },
        type: acc.type,
        subtype: acc.subtype,
      }));

      console.log("Persisting accounts with proper schema:", mappedAccounts);

      const response = await fetch(
        "https://backend-production-5eec.up.railway.app/api/v1/financial/accounts",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.accessToken}`,
          },
          body: JSON.stringify({ accounts: mappedAccounts }),
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

  return (
    <DashboardLayout
      title="Life Dashboard"
      loading={loading}
      activeCategory={activeCategory}
      setActiveCategory={setActiveCategory}
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cardConfigs.map(
          (config, index) =>
            shouldShowCard(config.title) && (
              <DashboardCard
                key={config.id}
                className={`floating-card float-delay-${(index % 4) + 1}`}
                title={config.title}
                value={formatMetric(config.value, config.format)}
                icon={config.icon}
                additionalInfo={config.additionalInfo}
                status={config.status}
                goalValue={config.goalValue}
              />
            )
        )}
      </div>

      {(activeCategory === "all" || activeCategory === "finances") &&
        accounts.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center justify-between mb-4">
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
                      <div className="font-medium text-sm">{account.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {account.type} • {account.subtype}
                      </div>
                    </div>
                  </div>
                  <div className="font-medium text-sm">
                    $
                    {account.balances.current?.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </div>
              ))}

              {accounts.length > 3 && (
                <button className="text-center text-xs text-indigo-500 hover:text-indigo-600 py-2">
                  Show {accounts.length - 3} more accounts
                </button>
              )}

              <div className="mt-3 flex justify-end">
                <PlaidConnect
                  onSuccess={handlePlaidSuccess}
                  buttonText="Add Account"
                  buttonClassName="text-xs rounded-full py-1.5 px-4 bg-indigo-500/80 text-white hover:bg-indigo-600/80 transition-colors"
                />
              </div>
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
