// src/app/api/financial/bank-accounts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const res = await fetch(
      "https://backend-production-5eec.up.railway.app/api/v1/financial/bank-accounts",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`, // Use the token from auth
        },
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data.message || "Failed to fetch bank accounts" }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching bank accounts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}