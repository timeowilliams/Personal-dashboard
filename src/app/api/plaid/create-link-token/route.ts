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

export async function POST() {
  try {
    const requestData = {
      client_name: 'Personal Dashboard',
      language: 'en',
      user: { client_user_id: 'test-user-id' }, // Replace with a unique ID for each user
      products: ['transactions'], // Only transactions
      country_codes: ['US'],
    };

    console.log('Making request with:', requestData);
    const response = await plaidClient.linkTokenCreate(requestData);
    console.log('Success:', { link_token: response.data.link_token });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    return NextResponse.json({ error: 'Failed to create link token' }, { status: 500 });
  }
}