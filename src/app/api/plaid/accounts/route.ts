import { NextResponse } from 'next/server';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

// Ensure environment variables are loaded
if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET) {
  throw new Error("Plaid environment variables (PLAID_CLIENT_ID or PLAID_SECRET) are missing");
}

// Create Plaid client configuration
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

export async function GET(request: Request) {
console.log("API: /api/plaid/accounts v2 request received");
  
  // Check for access token in headers (try multiple possible header names)
  const accessToken = 
    request.headers.get('Plaid-Access-Token') || 
    request.headers.get('Authorization')?.replace('Bearer ', '') ||
    request.headers.get('plaid-access-token');
  
  // Log what we received (masked for security)
  console.log("API: Access token received:", accessToken ? `${accessToken.substring(0, 5)}...` : 'none');

  if (!accessToken) {
    console.error("API: No access token provided in request headers");
    return NextResponse.json(
      { 
        error: 'No access token provided', 
        receivedHeaders: Object.fromEntries(request.headers.entries())
      },
      { status: 400 }
    );
  }

  try {
    console.log("API: Calling Plaid /accounts/get with access token");
    
    const response = await client.accountsGet({
      access_token: accessToken,
    });
    
    console.log("API: Plaid /accounts/get success:", {
      accountCount: response.data.accounts?.length || 0,
      itemId: response.data.item?.item_id
    });

    return NextResponse.json({
      accounts: response.data.accounts,
      item: response.data.item,
      request_id: response.data.request_id
    });
  } catch (error: any) {
    // Enhanced error logging
    console.error("API: Error fetching Plaid accounts:", error);
    
    // Get detailed Plaid error info if available
    const plaidError = error.response?.data?.error_code 
      ? {
          error_code: error.response.data.error_code,
          error_message: error.response.data.error_message,
          error_type: error.response.data.error_type,
          display_message: error.response.data.display_message
        }
      : null;
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json(
      { 
        error: "Failed to fetch accounts", 
        details: errorMessage,
        plaidError: plaidError,
        statusCode: error.response?.status
      },
      { status: error.response?.status || 500 }
    );
  }
}