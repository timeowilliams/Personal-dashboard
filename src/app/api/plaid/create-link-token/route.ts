// app/api/plaid/create-link-token/route.ts
import { NextResponse } from "next/server";
import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  Products,
  CountryCode,
} from "plaid";


const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'Content-Type': 'application/json',
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SANDBOX_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(configuration);

export async function POST() {

  if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SANDBOX_SECRET) {
    throw new Error('Missing required Plaid environment variables');
  }
  try {

    console.log('Creating link token with credentials:', {
      hasClientId: !!process.env.PLAID_CLIENT_ID,
      hasSecret: !!process.env.PLAID_SANDBOX_SECRET,
      environment: PlaidEnvironments.sandbox
    });


    const requestData = {
      client_name: "Personal Dashboard",
      language: "en",
      user: {
        client_user_id: "test-user-id"
      },
      products: [Products.Auth, Products.Transactions],
      country_codes: [CountryCode.Us],
    };

    console.log('Making request with:', {
      base_path: PlaidEnvironments.sandbox,
      client_id_prefix: process.env.PLAID_CLIENT_ID?.substring(0, 8) + '...',
      secret_length: process.env.PLAID_SANDBOX_SECRET?.length,
      request: requestData
    });

    const response = await plaidClient.linkTokenCreate(requestData);

    console.log('Successful response:', {
      link_token_received: !!response.data.link_token,
      expiration: response.data.expiration,
      request_id: response.data.request_id
    });


    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error creating link token:", error);
    return NextResponse.json(
      { error: "Failed to create link token" },
      { status: 500 }
    );
  }
}
