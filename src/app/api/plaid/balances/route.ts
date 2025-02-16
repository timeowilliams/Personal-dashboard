import { NextResponse } from 'next/server';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID!,
      'PLAID-SECRET': process.env.PLAID_SANDBOX_SECRET!,
    },
  },
});

const plaidClient = new PlaidApi(configuration);

export async function GET(request: Request) {
  const accessToken = request.headers.get('plaid-access-token');

  if (!accessToken) {
    return NextResponse.json(
      { error: 'No access token provided' },
      { status: 400 }
    );
  }

  try {
    const response = await plaidClient.accountsBalanceGet({
      access_token: accessToken,
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching balances:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balances' },
      { status: 500 }
    );
  }
}