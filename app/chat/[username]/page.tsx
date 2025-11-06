"use client";

import React, { useEffect, useState, useRef, FormEvent } from "react";
import { redirect, useParams } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { useSession } from "next-auth/react";
import type { Message } from "@prisma/client";
import { IoChevronBackSharp } from "react-icons/io5";
import Image from "next/image";
import { MdSend } from "react-icons/md";

export default function ChatPage() {
  const { username } = useParams<{ username: string }>();
  const { data: session } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Connect socket when authenticated
  useEffect(() => {
    if (!session?.user) return;

    // Fetch short-lived socket auth token
    const connectSocket = async () => {
      try {
        const res = await fetch("/api/socket/token");
        if (res.ok) {
          console.log("we are here now");
        }
        const data = await res.json();
        console.log("SocketData:", data);

        if (!res.ok || !data.ok) {
          console.error("Socket token error:", data.error);
          return;
        }

        const token = data.data.token;

        const newSocket = io(
          process.env.NEXT_PUBLIC_SOCKET_SERVER_URL as string,
          {
            auth: { token },
            transports: ["websocket"],
          }
        );

        newSocket.on("connect", () => {
          console.log("Socket connected:", newSocket.id);
        });

        // Incoming messages listener
        newSocket.on("receiveMessage", (message: Message) => {
          setMessages((prev) => [...prev, message]);
        });

        setSocket(newSocket);

        return () => {
          newSocket.disconnect();
        };
      } catch (error) {
        console.error("Socket connection error:", error);
      }
    };

    connectSocket();
  }, [session]);

  // Fetch conversation history
  useEffect(() => {
    if (!username) return;

    const loadMessages = async () => {
      const res = await fetch(`/api/chat/${username}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data: Message[] = await res.json();
        setMessages(data);
      }
    };

    loadMessages();
  }, [username]);

  // Send message handler
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;

    const messageData = {
      content: input.trim(),
      toUsername: username,
    };

    // Optimistically update local state
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content: input.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
      fromUserId: session?.user.id as string,
      toUserId: "",
      toUser: { id: "", username, image: "" },
      fromUser: {
        id: session?.user.id as string,
        username: session?.user.username ?? "You",
        image: session?.user.image ?? "",
      },
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setInput("");

    // Emit to server
    socket.emit("sendMessage", messageData);

    // Also persist via API , but is ther any need for this, if not to store our message in the db
    await fetch(`/api/chat/${username}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: input }),
      credentials: "include",
    });
  };

  const handleReturn = () => {
    redirect("/dashboard");
  };
  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto">
      <header className="flex p-4 border-b border-neutral-200 font-semibold text-lg gap-5 items-center">
        <button
          onClick={handleReturn}
          className="p-2 bg-neutral-100 backdrop-blur-2xl rounded-full border-neutral-300"
        >
          <IoChevronBackSharp size={20} />
        </button>
        <p>Chat with {username}</p>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.fromUser?.username === session?.user.username
                ? "justify-end"
                : "justify-start"
            }`}
          >
            <div
              className={` px-4 py-2 max-w-xs break-words text-sm shadow-sm ${
                msg.fromUser?.username === session?.user.username
                  ? "bg-teal-600 text-white rounded-2xl rounded-tr-none"
                  : "bg-gray-200 text-gray-900 rounded-2xl rounded-tl-none"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </main>

      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-neutral-200 bg-neutral-50 flex gap-2 items-center"
      >
        <input
          type="text"
          className="flex-1 bg-neutral-200 rounded-full px-4 py-2 focus:outline-none"
          placeholder="Write your message"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          type="submit"
          className="bg-teal-600 text-white px-4 py-2 rounded-full hover:bg-teal-950"
        >
          <MdSend />
        </button>
      </form>
    </div>
  );
}
