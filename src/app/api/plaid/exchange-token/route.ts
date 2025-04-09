import { NextResponse } from 'next/server';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

const configuration = new Configuration({
  basePath: PlaidEnvironments.production,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(configuration);

export async function POST(request: Request) {
  try {
    const { public_token } = await request.json();
    const response = await plaidClient.itemPublicTokenExchange({
      public_token,
    });

    const accessToken = response.data.access_token;
    const itemId = response.data.item_id;

    // TODO: Save accessToken to your database (associated with the user)
    console.log('Access token:', accessToken, 'Item ID:', itemId);

    return NextResponse.json({ access_token: accessToken, item_id: itemId });
  } catch (error) {
    console.error('Error exchanging token:', error.response?.data || error.message);
    return NextResponse.json({ error: 'Failed to exchange token' }, { status: 500 });
  }
}