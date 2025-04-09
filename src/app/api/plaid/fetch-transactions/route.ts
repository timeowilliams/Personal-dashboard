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
    const { access_token } = await request.json();

    // Fetch transactions for the last 30 days (adjust as needed)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);

    const response = await plaidClient.transactionsGet({
      access_token,
      start_date: startDate.toISOString().split('T')[0], // e.g., "2025-03-04"
      end_date: endDate.toISOString().split('T')[0], // e.g., "2025-04-03"
      options: {
        count: 100, // Number of transactions to fetch per page
        offset: 0, // Pagination offset
      },
    });

    const transactions = response.data.transactions;
    console.log('Fetched transactions:', transactions);

    // TODO: Save transactions to your database
    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('Error fetching transactions:', error.response?.data || error.message);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}