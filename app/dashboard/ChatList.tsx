"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface Conversation {
  id: string;
  lastMessagePreview: string;
  otherUser: {
    id: string;
    username: string;
    image: string | null;
  };
}

export default function ChatList({
  currentUsername,
}: {
  currentUsername: string;
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await fetch(`/api/chat/list`);

        if (!res.ok) {
          throw new Error("error:");
        }

        const data: Conversation[] = await res.json();
        setConversations(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchChats();
  }, [currentUsername]);

  if (isLoading) {
    return <div className="p-5 text-center">Loading chats...</div>;
  }

  if (error) {
    return <div className="p-5 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="py-0 px-[10px]">
      <h3 className="py-[10px] border-b border-gray-200 text-center ">
        Your Chats
      </h3>
      {conversations.length === 0 ? (
        <p className="text-center mt-5">
          You have no active chats. Click the search button to find and add
          users!
        </p>
      ) : (
        conversations.map((conversation) => (
          <Link
            key={conversation.id}
            href={`/chat/${conversation.otherUser.username}`}
            className="flex items-center gap-4 py-4 px-2 no-underline text-inherit  border-b border-[#f0f0f0]"
          >
            {/* User Image */}
            {conversation.otherUser.image && (
              <Image
                src={conversation.otherUser.image}
                alt={conversation.otherUser.username}
                width={50}
                height={50}
                className="rounded-full object-cover"
              />
            )}

            {/* Chat Details */}
            <div>
              <strong className="font-semibold text-xl">
                {conversation.otherUser.username}
              </strong>
              <p className="text-[#666] text-xs m-0 whitespace-nowrap overflow-hidden text-ellipsis max-w-[250px]">
                {conversation.lastMessagePreview || "Start chatting now!"}
              </p>
            </div>
          </Link>
        ))
      )}
    </div>
  );
}
