import { NextResponse } from "next/server";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

interface PlaidErrorResponse {
  response?: {
    data?: string | { message: string };
  };
}

const configuration = new Configuration({
  basePath: PlaidEnvironments.production,
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
      "PLAID-SECRET": process.env.PLAID_SECRET,
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
    console.log("Access token:", accessToken, "Item ID:", itemId);

    return NextResponse.json({ access_token: accessToken, item_id: itemId });
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null && "response" in error
        ? (error as PlaidErrorResponse).response?.data || "Unknown error"
        : "An unknown error occurred";
    console.error("Error exchanging token:", errorMessage);
    return NextResponse.json(
      { error: "Failed to exchange token" },
      { status: 500 }
    );
  }
}
