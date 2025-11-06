import { getServerSession } from "next-auth";
import React from "react";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userInfo = await getServerSession(authOptions);
  if (!userInfo?.user) {
    return redirect("/onboarding");
  }
  //Do the same thing if you have a role-based authorization
  return <div>{children}</div>;
}
