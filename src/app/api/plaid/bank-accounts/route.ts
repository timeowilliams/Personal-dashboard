import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log("Attempting to authenticate with backend...");
    console.log("Username:", process.env.BACKEND_USERNAME);
    console.log("Password:", process.env.BACKEND_PASSWORD);

    const loginResponse = await fetch(
      "https://backend-production-5eec.up.railway.app/api/v1/auth/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: process.env.BACKEND_USERNAME,
          password: process.env.BACKEND_PASSWORD,
        }),
      }
    );

    const loginData = await loginResponse.json();
    console.log("Login Response:", loginData);

    if (!loginResponse.ok || !loginData.token) {
      throw new Error(
        loginData.message || "Failed to authenticate with backend"
      );
    }

    // Use the token to fetch bank accounts (e.g., from a database or Plaid)
    // Placeholder logic for fetching bank accounts
    const bankAccounts: Array<{ id: string; name: string; balance: number }> =
      []; // Replace with actual logic to fetch bank accounts

    return NextResponse.json({ bankAccounts });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    console.error("Error fetching bank accounts:", errorMessage);
    return NextResponse.json(
      { error: "Server error", details: errorMessage },
      { status: 500 }
    );
  }
}
