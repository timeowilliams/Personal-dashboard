/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/plaid/exchange-token/route.ts
import { NextResponse } from "next/server";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

const configuration = new Configuration({
  basePath: PlaidEnvironments.production,
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID!,
      "PLAID-SECRET": process.env.PLAID_SECRET!,
    },
  },
});

const client = new PlaidApi(configuration);

export async function POST(request: Request) {
  try {
    const { public_token } = await request.json();

    if (!public_token || !public_token.startsWith("public-")) {
      return NextResponse.json(
        { error: "Invalid public token format" },
        { status: 400 }
      );
    }

    console.log("Exchanging public token:", public_token);

    if (!public_token) {
      return NextResponse.json(
        { error: "No public token provided" },
        { status: 400 }
      );
    }

    const response = await client.itemPublicTokenExchange({
      public_token,
    });
    console.log("Plaid exchange response:", response.data);

    return NextResponse.json({
      access_token: response.data.access_token,
      item_id: response.data.item_id,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null && "response" in error
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (error.response as any)?.data?.error_message || "Unknown error"
        : "An unknown error occurred";
    const errorCode =
      typeof error === "object" && error !== null && "response" in error
        ? (error.response as any)?.data?.error_code || "UNKNOWN"
        : "UNKNOWN";
    return NextResponse.json(
      {
        error: "Failed to exchange token",
        details: errorMessage,
        code: errorCode,
      },
      {
        status:
          typeof error === "object" && error !== null && "response" in error
            ? (error.response as any)?.status || 500
            : 500,
      }
    );
  }
}
