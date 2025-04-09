// app/api/oura/auth/route.ts
import { NextResponse } from "next/server";

const OURA_CLIENT_ID = process.env.OURA_CLIENT_ID;
const OURA_CLIENT_SECRET = process.env.OURA_CLIENT_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    console.error("Error from Oura:", error);
    return NextResponse.json({ error }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  try {
    console.log("Exchanging code for token...");

    const tokenResponse = await fetch("https://api.ouraring.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: OURA_CLIENT_ID!,
        client_secret: OURA_CLIENT_SECRET!,
        redirect_uri: `${APP_URL}/api/oura/auth`,
      }).toString(),
    });

    console.log("Token response status:", tokenResponse.status);

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Token exchange failed:", errorData);
      return NextResponse.json(
        { error: "Failed to exchange code for token" },
        { status: tokenResponse.status }
      );
    }

    const tokenData = await tokenResponse.json();

    // Redirect back to the main page with the token
    if (!APP_URL) {
      throw new Error("APP_URL environment variable is not defined");
    }
    const redirectUrl = new URL(APP_URL);
    redirectUrl.searchParams.set("access_token", tokenData.access_token);

    return NextResponse.redirect(redirectUrl.toString());
  } catch (error) {
    console.error("Error in Oura authentication:", error);
    return NextResponse.json(
      { error: "Failed to authenticate with Oura" },
      { status: 500 }
    );
  }
}
