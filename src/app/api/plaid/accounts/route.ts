// app/api/plaid/accounts/route.ts
import { NextResponse } from 'next/server';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

const configuration = new Configuration({
  basePath: PlaidEnvironments.production,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID!,
      'PLAID-SECRET': process.env.PLAID_SECRET!,
    },
  },
});

const client = new PlaidApi(configuration);

export async function GET(request: Request) {
  const accessToken = request.headers.get('Plaid-Access-Token');

  if (!accessToken) {
    return NextResponse.json(
      { error: 'No access token provided' },
      { status: 400 }
    );
  }

  try {
    const response = await client.accountsGet({
      access_token: accessToken,
    });

    return NextResponse.json({
      accounts: response.data.accounts,
      item: response.data.item,
    });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}