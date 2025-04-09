import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; 
import { redirect } from "next/navigation";
import Dashboard from './dashboard/page';

export default async function Page() {
  const session = await getServerSession(authOptions);

  // If the user is not authenticated, redirect to the login page
  if (!session) {
    redirect("/login");
  }

  return <Dashboard />;
}