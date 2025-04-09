
// app/api/oura/callback/route.ts
import { NextResponse } from 'next/server';
import { validateState } from '@/lib/auth';  // We'll create this

const OURA_TOKEN_URL = 'https://api.ouraring.com/oauth/token';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      throw new Error('No authorization code received');
    }

    // In production, validate the state parameter
    // if (!validateState(state)) {
    //   throw new Error('Invalid state parameter');
    // }

    const tokenResponse = await fetch(OURA_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: process.env.OURA_CLIENT_ID!,
        client_secret: process.env.OURA_CLIENT_SECRET!,
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      throw new Error(errorData.error || 'Token exchange failed');
    }

    const data = await tokenResponse.json();
    console.log('Oura token exchange response:', data);

    // Here you would typically:
    // 1. Store the tokens securely
    // 2. Associate them with the user's session
    // 3. Handle refresh token storage

    // For now, redirect back to the dashboard with success
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?connected=true`
    );
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=${encodeURIComponent(error.message)}`
    );
  }
}