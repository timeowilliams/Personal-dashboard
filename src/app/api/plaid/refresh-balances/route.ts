import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";
import { authOptions } from "../../../../lib/auth";

// Configure Plaid client
const configuration = new Configuration({
  basePath: PlaidEnvironments.production,
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
      "PLAID-SECRET": process.env.PLAID_SECRET,
    },
  },
});

const client = new PlaidApi(configuration);

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log("API: /refresh-balances called with session:", session);

    if (!session?.accessToken) {
      console.error("API: No access token in session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Step 1: Fetch bank accounts (contains Plaid access tokens)
    const bankAccountsResponse = await fetch(
      "https://backend-production-5eec.up.railway.app/api/v1/financial/bank-accounts",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!bankAccountsResponse.ok) {
      console.error(
        "API: Failed to fetch bank accounts, status:",
        bankAccountsResponse.status
      );
      throw new Error("Failed to fetch bank accounts");
    }

    const { bankAccounts } = await bankAccountsResponse.json();
    console.log("API: Received bank accounts:", bankAccounts?.length);

    if (!bankAccounts || bankAccounts.length === 0) {
      return NextResponse.json(
        { error: "No bank accounts found" },
        { status: 404 }
      );
    }

    // Step 2: For each bank account, fetch fresh balances from Plaid
    const updatedAccounts = [];
    const errors = [];

    for (const bankAccount of bankAccounts) {
      try {
        console.log(
          "API: Processing institution:",
          bankAccount.institutionName
        );
        console.log(
          "API: Access token (first 10 chars):",
          bankAccount.accessToken.substring(0, 10) + "..."
        );

        // Set min_last_updated_datetime to 24 hours ago
        const twentyFourHoursAgo = new Date(
          Date.now() - 24 * 60 * 60 * 1000
        ).toISOString();

        const balanceResponse = await client
          .accountsBalanceGet({
            access_token: bankAccount.accessToken,
            options: {
              min_last_updated_datetime: twentyFourHoursAgo,
            },
          })
          .catch(async (error) => {
            // Log detailed error information
            console.error("API: Plaid API Error Details:", {
              error_type: error.response?.data?.error_type,
              error_code: error.response?.data?.error_code,
              error_message: error.response?.data?.error_message,
              display_message: error.response?.data?.display_message,
            });

            // If token is invalid or expired, we might need to re-authenticate
            if (
              error.response?.data?.error_code === "INVALID_ACCESS_TOKEN" ||
              error.response?.data?.error_code === "ITEM_LOGIN_REQUIRED"
            ) {
              errors.push({
                institution: bankAccount.institutionName,
                error: "Needs reauthorization",
                error_code: error.response?.data?.error_code,
              });
              return null;
            }
            throw error;
          });

        if (!balanceResponse) continue; // Skip if we got null from error handling

        // Map the Plaid accounts to your schema
        const mappedAccounts = balanceResponse.data.accounts.map((acc) => ({
          accountId: acc.account_id,
          name: acc.name,
          balances: {
            available: acc.balances.available || acc.balances.current || 0,
            current: acc.balances.current || 0,
            iso_currency_code: acc.balances.iso_currency_code || "USD",
          },
          type: acc.type,
          subtype: acc.subtype || "",
          bankAccount: bankAccount._id,
        }));

        updatedAccounts.push(...mappedAccounts);
        console.log(
          `API: Successfully processed ${mappedAccounts.length} accounts for ${bankAccount.institutionName}`
        );
      } catch (error) {
        console.error(
          `API: Error processing institution: ${bankAccount.institutionName}`,
          error
        );
        errors.push({
          institution: bankAccount.institutionName,
          error: error.message,
        });
        continue;
      }
    }

    if (updatedAccounts.length === 0) {
      console.error("API: No accounts were successfully updated");
      return NextResponse.json(
        {
          error: "No accounts were updated",
          details: errors,
        },
        { status: 500 }
      );
    }

    // Step 3: Update the accounts in your backend
    const updateResponse = await fetch(
      "https://backend-production-5eec.up.railway.app/api/v1/financial/accounts",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ accounts: updatedAccounts }),
      }
    );

    if (!updateResponse.ok) {
      console.error(
        "API: Failed to update account balances, status:",
        updateResponse.status
      );
      throw new Error("Failed to update account balances");
    }

    console.log(
      "API: Successfully updated",
      updatedAccounts.length,
      "accounts"
    );
    return NextResponse.json({
      success: true,
      accounts: updatedAccounts,
      message: `Successfully updated ${updatedAccounts.length} accounts`,
      warnings: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("API: Error refreshing balances:", error);
    return NextResponse.json(
      {
        error: "Failed to refresh balances",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
