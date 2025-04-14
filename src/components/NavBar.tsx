"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function NavBar() {
  const { data: session, status } = useSession();

  return (
    <nav className="p-4 bg-gray-800 text-white">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-lg font-bold flex items-center gap-2">
          <Image
            src="/favicon-32x32.png"
            alt="Life Dashboard"
            width={32}
            height={32}
          />
          Life Dashboard
        </Link>
        <div className="space-x-4">
          <Link href="/dashboard">Dashboard</Link>
          {status === "authenticated" ? (
            <Button
              variant="outline"
              className="text-white border-white hover:bg-gray-700"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Logout
            </Button>
          ) : (
            <Link href="/login">Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
