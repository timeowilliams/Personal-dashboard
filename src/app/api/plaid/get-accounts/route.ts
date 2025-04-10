import { NextResponse } from 'next/server';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

// Configure Plaid client
const configuration = new Configuration({
  basePath: PlaidEnvironments.production,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const client = new PlaidApi(configuration);

export async function POST(request: Request) {
  console.log("API: /api/plaid/get-accounts endpoint called");
  
  try {
    // Parse request body
    const body = await request.json();
    const accessToken = body.access_token;
    
    console.log("API: Access token received (first 5 chars):", 
      accessToken ? accessToken.substring(0, 5) + "..." : "none");
    
    if (!accessToken) {
      console.error("API: No access token provided in request");
      return NextResponse.json(
        { error: 'No access token provided' },
        { status: 400 }
      );
    }
    
    console.log("API: Calling Plaid accountsGet with access token");
    const response = await client.accountsGet({
      access_token: accessToken,
    });
    
    console.log("API: Plaid accounts fetch successful, returned", 
      response.data.accounts?.length || 0, "accounts");
    
    return NextResponse.json({
      accounts: response.data.accounts,
      item: response.data.item,
      request_id: response.data.request_id
    });
  } catch (error: any) {
    console.error("API: Error fetching Plaid accounts:", error);
    
    // Extract detailed Plaid error info if available
    const plaidError = error.response?.data ? {
      error_code: error.response.data.error_code,
      error_message: error.response.data.error_message,
      error_type: error.response.data.error_type,
    } : null;
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json(
      { 
        error: "Failed to fetch accounts", 
        details: errorMessage,
        plaidError: plaidError,
      },
      { status: 500 }
    );
  }
}