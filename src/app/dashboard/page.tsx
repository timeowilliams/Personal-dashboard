'use client';
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import OuraConnect from '@/components/OuraConnect';
import PlaidConnect from '@/components/PlaidConnect';
import { 
  DollarSign, CreditCard, Wallet, Moon, Clock, Droplet, Flame, Apple, Beef, 
  ChevronsLeft, Ruler, User, Footprints, Scale, Percent 
} from 'lucide-react';

interface Account {
  id: string;
  name: string;
  balances: {
    available: number;
    current: number;
    iso_currency_code: string;
  };
  type: string;
  subtype: string;
}

interface BankAccount {
  _id: string;
  accessToken: string;
  institutionName: string;
}

interface ActivityData {
  sleep?: number;
  activity?: number; // In hours, converted from minutes
  waterIntake?: number;
  calories?: number;
  carbs?: number;
  protein?: number;
  fat?: number;
  steps?: number;
  weight?: number;
  bodyFat?: number;
  waistCircumference?: number;
  waistDate?: string;
  weightDate?: string;
  bodyFatDate?: string;
}

interface PostureData {
  posture: string;
  grade: string;
  score: number;
  feedback?: string;
}

interface Transaction {
  amount: number;
  date: string;
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

  // Fetch bank accounts and their data
  useEffect(() => {
    if (status !== 'authenticated') return;

    const fetchBankAccounts = async () => {
      try {
        setLoading(true);
        const bankAccountsResponse = await fetch('/api/plaid/bank-accounts', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        const bankAccountsData = await bankAccountsResponse.json();
        setBankAccounts(bankAccountsData.bankAccounts || []);

        const allAccounts: Account[] = [];
        for (const bankAccount of bankAccountsData.bankAccounts || []) {
          const accountsResponse = await fetch('/api/plaid/accounts', {
            method: 'GET',
            headers: { 'Plaid-Access-Token': bankAccount.accessToken },
          });
          const accountsData = await accountsResponse.json();
          allAccounts.push(...(accountsData.accounts || []));
        }

        setAccounts(allAccounts);

        if (allAccounts.length > 0) {
          await persistAccounts(allAccounts);
        }

        const total = allAccounts.reduce((sum: number, account: Account) => 
          sum + (account.balances.current || 0), 0);
        setNetWorth(total);
      } catch (error) {
        console.error('Error fetching bank accounts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBankAccounts();
  }, [status]);

  // Fetch today's data (health and posture)
  useEffect(() => {
    if (status !== 'authenticated') return;

    const fetchTodayData = async () => {
      try {
        // Remove date filter to get the most recent data regardless of date
        const healthResponse = await fetch(
          `https://backend-production-5eec.up.railway.app/api/v1/health`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.accessToken}`,
            },
          }
        );
        if (!healthResponse.ok) {
          throw new Error(`Health API failed with status ${healthResponse.status}`);
        }
        const healthData = await healthResponse.json();
        console.log('Health API Response:', healthData);

        if (healthData.length > 0) {
          // Sort by timestamp to get the latest entry
          const latestHealth = healthData.sort((a: any, b: any) => 
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
        const today = new Date().toISOString().split('T')[0];
        const postureResponse = await fetch(
          `https://backend-production-5eec.up.railway.app/api/v1/posture?date=${today}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.accessToken}`,
            },
          }
        );
        if (!postureResponse.ok) {
          throw new Error(`Posture API failed with status ${postureResponse.status}`);
        }
        const postureData = await postureResponse.json();
        if (postureData.length > 0) {
          setTodayPosture(postureData[0]);
        }

        // Fetch financial data
        const financialResponse = await fetch(
          `https://backend-production-5eec.up.railway.app/api/v1/financial?date=${today}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.accessToken}`,
            },
          }
        );
        if (!financialResponse.ok) {
          throw new Error(`Financial API failed with status ${financialResponse.status}`);
        }
        const financialData = await financialResponse.json();
        const todaySpendingTotal = financialData.transactions.reduce(
          (sum: number, transaction: Transaction) => sum + transaction.amount,
          0
        );
        setTodaySpending(todaySpendingTotal);
      } catch (error) {
        console.error('Error fetching today’s data:', error);
      }
    };

    fetchTodayData();
  }, [status, ouraToken, session]);

  const persistAccounts = async (accountsToPersist: Account[]) => {
    try {
      const response = await fetch('https://backend-production-5eec.up.railway.app/api/v1/financial/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({ accounts: accountsToPersist }),
      });

      if (!response.ok) {
        throw new Error('Failed to persist accounts');
      }
      console.log('Accounts persisted successfully');
    } catch (error) {
      console.error('Error persisting accounts:', error);
    }
  };

  const handlePlaidSuccess = async (token: string) => {
    const bankAccountsResponse = await fetch('/api/plaid/bank-accounts', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const bankAccountsData = await bankAccountsResponse.json();
    setBankAccounts(bankAccountsData.bankAccounts || []);

    const allAccounts: Account[] = [];
    for (const bankAccount of bankAccountsData.bankAccounts || []) {
      const accountsResponse = await fetch('/api/plaid/accounts', {
        method: 'GET',
        headers: { 'Plaid-Access-Token': bankAccount.accessToken },
      });
      const accountsData = await accountsResponse.json();
      allAccounts.push(...(accountsData.accounts || []));
    }

    setAccounts(allAccounts);

    if (allAccounts.length > 0) {
      await persistAccounts(allAccounts);
    }

    const total = allAccounts.reduce((sum: number, account: Account) => 
      sum + (account.balances.current || 0), 0);
    setNetWorth(total);
  };

  const handleOuraSuccess = (token: string) => {
    setOuraToken(token);
  };

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (status === 'unauthenticated') {
    console.log('User is not authenticated');
    return <div>Please log in to view the dashboard.</div>;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold tracking-tight">Life Dashboard</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today’s Spending</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${todaySpending.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
                {todayData.sleep ? todayData.sleep.toFixed(2) : '0.00'} hours
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
                {todayData.activity ? todayData.activity.toFixed(2) : '0.00'} hours
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
                {todayData.steps ? todayData.steps.toFixed(0) : '0'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Water Intake</CardTitle>
              <Droplet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todayData.waterIntake ? todayData.waterIntake.toFixed(2) : '0.00'} L
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
                {todayData.calories ? todayData.calories.toFixed(0) : '0'} kCal
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
                {todayData.carbs ? todayData.carbs.toFixed(0) : '0'} g
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
                {todayData.protein ? todayData.protein.toFixed(0) : '0'} g
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
                {todayData.fat ? todayData.fat.toFixed(0) : '0'} g
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Waist Circumference</CardTitle>
              <Ruler className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todayData.waistCircumference ? todayData.waistCircumference.toFixed(1) : '0.0'} in
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
                {todayData.weight ? (todayData.weight * 2.20462).toFixed(1) : '0.0'} lbs
              </div>
              {todayData.weightDate && (
                <div className="text-sm text-muted-foreground">
                  Measured: {new Date(todayData.weightDate).toLocaleDateString()}
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
                {todayData.bodyFat ? todayData.bodyFat.toFixed(1) : '0.0'}%
              </div>
              {todayData.bodyFatDate && (
                <div className="text-sm text-muted-foreground">
                  Measured: {new Date(todayData.bodyFatDate).toLocaleDateString()}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Posture Grade</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todayPosture ? todayPosture.grade : 'N/A'}
              </div>
              {todayPosture && (
                <div className="text-sm text-muted-foreground">
                  Score: {todayPosture.score.toFixed(0)}/100
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {bankAccounts.length > 0 ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${netWorth.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
                  {accounts.map(account => (
                    <div 
                      key={account.id} 
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        {account.type === 'credit' ? (
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
                        ${account.balances.current?.toLocaleString('en-US', { 
                          minimumFractionDigits: 2 
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <PlaidConnect onSuccess={handlePlaidSuccess} buttonText="Add Another Account" />
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
                  <h3 className="text-lg font-medium">Connect Your Oura Ring</h3>
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