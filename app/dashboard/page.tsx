import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../api/auth/[...nextauth]/route";
import DashboardClient from "@/app/dashboard/DashboardClient";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.id) {
    redirect("/");
  }

  if (!session.user.username) {
    redirect("/onboarding");
  }

  const userData = {
    id: session.user.id,
    username: session.user.username,
    image: session.user.image,
  };

  return <DashboardClient userData={userData}/>

}
