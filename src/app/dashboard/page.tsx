"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import OuraConnect from "@/components/OuraConnect";
import PlaidConnect from "@/components/PlaidConnect";
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
import { Account, BankAccount, HealthData, PostureData, ActivityData, Transaction, DeepWorkData } from "@/types";

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

  const handlePlaidSuccess = async (publicToken: string, metadata: any) => {
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
        const mappedAccounts = accountsData.accounts.map((acc) => ({
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
        }));

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
        const mappedAccounts = persistedData.accounts.map((acc: any) => ({
          accountId: acc.accountId,
          name: acc.name,
          balances: acc.balances,
          type: acc.type,
          subtype: acc.subtype,
        }));
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

  // Fetch all data on initial load
  useEffect(() => {
    if (status !== "authenticated") {
      console.log("Not authenticated");
      return;
    }

    console.log("Initial fetch with token:", session?.accessToken);
    fetchAllData();
  }, [status, session]);

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

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (status === "unauthenticated") {
    console.log("User is not authenticated");
    return <div>Please log in to view the dashboard.</div>;
  }

  // Debug render
  console.log("Rendering with accounts:", accounts);
  console.log("Rendering with bankAccounts:", bankAccounts);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold tracking-tight">Life Dashboard</h1>
          {loading && <div>Refreshing data...</div>}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Today's Spending
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                $
                {todaySpending.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Checking Account Balance
              </CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                $
                {accounts
                  .filter(
                    (acc) =>
                      acc.type === "depository" && acc.subtype === "checking"
                  )
                  .reduce((sum, acc) => sum + (acc.balances.current || 0), 0)
                  .toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sleep</CardTitle>
              <Moon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todayData.sleep ? todayData.sleep.toFixed(2) : "0.00"} hours
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activity</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todayData.activity ? todayData.activity.toFixed(2) : "0.00"}{" "}
                hours
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Steps</CardTitle>
              <Footprints className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todayData.steps ? todayData.steps.toFixed(0) : "0"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Water Intake
              </CardTitle>
              <Droplet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todayData.waterIntake
                  ? todayData.waterIntake.toFixed(2)
                  : "0.00"}{" "}
                L
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Calories</CardTitle>
              <Flame className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todayData.calories ? todayData.calories.toFixed(0) : "0"} kCal
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Carbs</CardTitle>
              <Apple className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todayData.carbs ? todayData.carbs.toFixed(0) : "0"} g
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Protein</CardTitle>
              <Beef className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todayData.protein ? todayData.protein.toFixed(0) : "0"} g
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fat</CardTitle>
              <ChevronsLeft className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todayData.fat ? todayData.fat.toFixed(0) : "0"} g
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Waist Circumference
              </CardTitle>
              <Ruler className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todayData.waistCircumference
                  ? todayData.waistCircumference.toFixed(1)
                  : "0.0"}{" "}
                in
              </div>
              {todayData.waistDate && (
                <div className="text-sm text-muted-foreground">
                  Measured: {new Date(todayData.waistDate).toLocaleDateString()}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weight</CardTitle>
              <Scale className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todayData.weight
                  ? (todayData.weight * 2.20462).toFixed(1)
                  : "0.0"}{" "}
                lbs
              </div>
              {todayData.weightDate && (
                <div className="text-sm text-muted-foreground">
                  Measured:{" "}
                  {new Date(todayData.weightDate).toLocaleDateString()}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Body Fat</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todayData.bodyFat ? todayData.bodyFat.toFixed(1) : "0.0"}%
              </div>
              {todayData.bodyFatDate && (
                <div className="text-sm text-muted-foreground">
                  Measured:{" "}
                  {new Date(todayData.bodyFatDate).toLocaleDateString()}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Posture Grade
              </CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todayPosture ? todayPosture.grade : "N/A"}
              </div>
              {todayPosture && (
                <div className="text-sm text-muted-foreground">
                  Score: {todayPosture.score.toFixed(0)}/100
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Deep Work</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todayDeepWorkHours.toFixed(2)} hours
              </div>
            </CardContent>
          </Card>
        </div>

        {accounts.length > 0 ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Net Worth
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    $
                    {netWorth.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Connected Accounts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {accounts.map((account) => (
                    <div
                      key={account.accountId}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        {account.type === "credit" ? (
                          <CreditCard className="h-6 w-6" />
                        ) : (
                          <Wallet className="h-6 w-6" />
                        )}
                        <div>
                          <div className="font-medium">{account.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {account.type} • {account.subtype}
                          </div>
                        </div>
                      </div>
                      <div className="font-medium">
                        $
                        {account.balances.current?.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <PlaidConnect
                    onSuccess={handlePlaidSuccess}
                    buttonText="Add Another Account"
                  />
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="mt-6">
            <CardContent className="flex flex-col items-center justify-center p-6">
              <div className="text-center space-y-2 mb-4">
                <h3 className="text-lg font-medium">Connect Your Accounts</h3>
                <p className="text-sm text-muted-foreground">
                  Link your bank accounts to see your financial overview
                </p>
              </div>
              <PlaidConnect onSuccess={handlePlaidSuccess} />
            </CardContent>
          </Card>
        )}

        <Card className="mt-6">
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
      </div>
    </div>
  );
};

export default Dashboard;