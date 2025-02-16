'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, CreditCard, Wallet, TrendingUp } from 'lucide-react';
import PlaidConnect from '@/components/PlaidConnect';

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

const Dashboard = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [netWorth, setNetWorth] = useState(0);

  // Fetch accounts when we have an access token
  useEffect(() => {
    const fetchAccounts = async () => {
      if (!accessToken) return;
      
      try {
        setLoading(true);
        const response = await fetch('/api/plaid/accounts', {
          headers: {
            'Plaid-Access-Token': accessToken
          }
        });
        const data = await response.json();
        setAccounts(data.accounts);
        
        // Calculate net worth
        const total = data.accounts.reduce((sum: number, account: Account) => 
          sum + (account.balances.current || 0), 0);
        setNetWorth(total);
      } catch (error) {
        console.error('Error fetching accounts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, [accessToken]);

  const handlePlaidSuccess = (token: string) => {
    setAccessToken(token);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold tracking-tight">Financial Dashboard</h1>
          {!accessToken && (
            <div className="w-48">
              {/* <PlaidConnect onSuccess={handlePlaidSuccess} /> */}
            </div>
          )}
        </div>
        
        {/* Financial Overview */}
        {accessToken ? (
          <>
            {/* Stats Grid */}
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

              {/* Add more stat cards here */}
            </div>

            {/* Accounts List */}
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
      </div>
    </div>
  );
};

export default Dashboard;