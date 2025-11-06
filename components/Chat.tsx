"use client";
import React, { useEffect, useState } from "react";
import { JWT } from "next-auth/jwt";
import jwt from "jsonwebtoken";
import { io, Socket } from "socket.io-client";

type Message = {
  text: string;
};

// create a single socket instance
export const socket: Socket = io("http://localhost:3000");
const Chat = () => {
  const [message, setMessage] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<string[]>([]);
  const [myId, setmYId] = useState<string | undefined>(undefined);

  const socketInstance = socket;
  useEffect(
    () => {
      socketInstance.on("connect", () => {
        setmYId(socketInstance.id);
      });
      const onChatMessage = ({
        text,
        senderId,
      }: {
        text: string;
        senderId: string;
      }) => {
        setChatMessages((prev) => [...prev, text]);
      };
      socketInstance.on("chatMessage", onChatMessage);

      return () => {
        socketInstance.off("chatMessage", onChatMessage);
      };
    },
    [
      //    socketInstance
    ]
  );
  const sendMessage = () => {
    if (!message.trim()) return;
    socket.emit("startChat", message);
    setMessage("");
  };
  return (
    <div>
      <div>
        {chatMessages.map((text, index) => (
          <p key={index}>{text}</p>
        ))}
      </div>
      <div>
        <input
          type="text"
          placeholder="enter your message"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
          }}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default Chat;
