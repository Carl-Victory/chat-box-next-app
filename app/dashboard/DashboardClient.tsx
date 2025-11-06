"use client";
import Image from "next/image";
import React, { useState } from "react";
import { CiSearch } from "react-icons/ci";
import SearchUsers from "./SearchUsers";
import ChatList from "./ChatList";
import { IoChevronBackSharp } from "react-icons/io5";

interface UserData {
  id: string;
  username: string;
  image: string | null | undefined;
}

const DashboardClient = ({ userData }: { userData: UserData }) => {
  const [isSearching, setIsSearching] = useState(false);
  const FALLBACK_IMAGE = "https://placehold.co/400";
  return (
    <div className="bg-black">
      <div className="flex justify-between items-center p-6  text-white">
        <div
          onClick={() => setIsSearching(!isSearching)}
          className="cursor-pointer border border-white p-2 rounded-full hover:bg-neutral-700"
        >
          {!isSearching ? (
            <CiSearch size={24} />
          ) : (
            <IoChevronBackSharp size={24} />
          )}
        </div>
        <p className="font-semibold ">Home</p>
        {userData && (
          <Image
            src={userData.image ?? FALLBACK_IMAGE}
            alt={`${userData?.username}'s image`}
            width={50}
            height={50}
            className="rounded-full"
            unoptimized
          />
        )}
      </div>
      <div className="bg-white mt-10 rounded-tl-[40px]  rounded-tr-[40px]">
        {isSearching ? (
          <SearchUsers currentUserId={userData.id} />
        ) : (
          <ChatList currentUsername={userData.username} />
        )}
      </div>
    </div>
  );
};

export default DashboardClient;
