import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../api/auth/[...nextauth]/route";
import OnboardingForm from "@/components/OnboardingForm";

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    // If not logged in, redirect to login page
    redirect("/");
  }

  if (session.user.username) {
    // If username is already set, redirect to dashboard
    redirect("/dashboard");
  }

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl text-center font-bold mb-4">Welcome to ChatBox!</h1>
      <p className="mb-6 text-center font-light text-sm">
        Please choose a unique username to continue. This will be visible to
        your friends.
      </p>
      <OnboardingForm userId={session.user.id} />
    </div>
  );
}
