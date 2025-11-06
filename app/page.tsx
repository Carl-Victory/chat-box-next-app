import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import Link from "next/link";
import SignInForm from "@/components/SignInForm";
import { signIn } from "next-auth/react";
import { redirect } from "next/navigation";

async function getSession() {
  return await getServerSession(authOptions);
}

export default async function LandingPage() {
  const session = await getSession();

  if (session) {
    if (!session.user.username) {
      redirect("/onboarding");
      /*return (
        <div className="p-8">
          <h1>Welcome, {session.user.email}</h1>
          <p>You must set a username to continue.</p>
          <Link href="/onboarding" className="text-blue-500">
            Go to Onboarding
          </Link>
        </div>
      );*/
    }
    redirect("/dashboard");
    /* return (
      <div className="p-8">
        <h1>Welcome back, {session.user.username}!</h1>
        <p>You are logged in.</p>
        <Link href="/dashboard" className="text-blue-500">
          Go to Dashboard
        </Link>
        <form action="/api/auth/signout" method="POST">
          <button type="submit" className="text-red-500 block mt-4">
            Sign out
          </button>
        </form>
      </div>
    );*/
  }

  return (
    <div >
        <SignInForm />
 
    </div>
  );
}
