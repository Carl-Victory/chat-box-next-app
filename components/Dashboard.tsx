"use client";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import React from "react";

const Dashboard = () => {
  const router = useRouter();
  const HandleSignout = async () => {
    const signOutUser = await signOut({
      redirect: false,
      callbackUrl: "/signin",
    });
    router.push(signOutUser.url);
  };
  return (
    <div>
      <button onClick={HandleSignout}>LogOut</button>
    </div>
  );
};

export default Dashboard;
