"use client";
import React from "react";
import { useState, FormEvent } from "react";
import { CiSearch } from "react-icons/ci";
import Image from "next/image";

interface SearchResultUser {
  id: string;
  username: string;
  image: string | null;
}

const SearchUsers = ({ currentUserId }: { currentUserId: string }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setResults([]);

    try {
      // need to create an API route @ /api/users/search?q={query}
      const res = await fetch(
        `/api/users/search?q=${encodeURIComponent(query)}`
      );

      if (res.ok) {
        const data: SearchResultUser[] = await res.json();
        setResults(data.filter((user) => user.id !== currentUserId));
      } else {
        console.error("Search failed");
        setResults([]);
      }
    } catch (error) {
      console.error("Error during search:", error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleAddUser = async (targetUserId: string) => {
    // need to create an API route @ /api/chats
    try {
      console.log(currentUserId, targetUserId);
      const res = await fetch(`/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId1: currentUserId, userId2: targetUserId }),
      });

      if (res.ok) {
        alert("User added to your chat list!");
        //no login to add user to list
      } else {
        alert("Failed to start chat.");
      }
    } catch (error) {
      console.error("Error adding user:", error);
    }
  };

  return (
    <div className="p-5 gap-3">
      {/* Search Input Form */}
      <form onSubmit={handleSearch} style={{ display: "flex", gap: "10px" }}>
        <input
          type="text"
          placeholder="Search username..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="grow p-3 border border-neutral-500 rounded-full"
        />
        <button
          type="submit"
          disabled={isLoading}
          className=" p-3 border border-neutral-500 rounded-full"
        >
          {isLoading ? "..." : <CiSearch size={20} />}
        </button>
      </form>

      {/* Search Results List */}
      <div className="mt-5">
        {results.length > 0 ? (
          results.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-5 border-b border-gray-300"
            >
              <div className="flex items-center gap-[10px]">
                {user.image && (
                  <Image
                    src={user.image}
                    alt={user.username}
                    width={30}
                    height={30}
                    className="rounded-full"
                  />
                )}
                <span>{user.username}</span>
              </div>
              <button
                onClick={() => handleAddUser(user.id)}
                className="py-1 px-5 bg-neutral-100 rounded-full hover:bg-neutral-300"
              >
                +
              </button>
            </div>
          ))
        ) : (
          <p>{!isLoading && query.trim() && "No users found."}</p>
        )}
      </div>
    </div>
  );
};

export default SearchUsers;
