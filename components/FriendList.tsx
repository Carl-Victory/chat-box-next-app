// next-app/components/FriendList.tsx
"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface FriendRelation {
  id: string;
  peerId: string;
  username: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "BLOCKED";
  isRequestToYou: boolean;
  createdAt: string;
}

interface FriendListProps {
  userId: string;
}

export default function FriendList({ userId }: FriendListProps) {
  const [relations, setRelations] = useState<FriendRelation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  const fetchFriends = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/friends");
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error || "Failed to fetch friend list.");
        setRelations([]);
        return;
      }
      setRelations(data.data);
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred while fetching friends.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const handleResponse = async (
    friendId: string,
    action: "ACCEPT" | "REJECT"
  ) => {
    try {
      const res = await fetch("/api/friends/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendId, action }),
      });

      if (res.ok) {
        // Refresh list on success
        fetchFriends();
      } else {
        const data = await res.json();
        alert(`Failed to ${action.toLowerCase()} request: ${data.error}`);
      }
    } catch (error) {
      console.error(error);
      alert(`An error occurred while responding to the request.`);
    }
  };

  if (isLoading) return <div className="p-4">Loading friends...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  const acceptedFriends = relations.filter((r) => r.status === "ACCEPTED");
  const pendingRequests = relations.filter((r) => r.isRequestToYou);
  const sentRequests = relations.filter(
    (r) => r.status === "PENDING" && !r.isRequestToYou
  );

  return (
    <div className="space-y-6">
      <div className="border p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">
          Incoming Requests ({pendingRequests.length})
        </h3>
        {pendingRequests.length === 0 ? (
          <p className="text-gray-500">No pending friend requests.</p>
        ) : (
          <ul className="space-y-2">
            {pendingRequests.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between p-2 border-b last:border-b-0"
              >
                <span className="font-medium">@{r.username}</span>
                <div className="space-x-2">
                  <button
                    onClick={() => handleResponse(r.id, "ACCEPT")}
                    className="text-white bg-green-500 hover:bg-green-600 px-3 py-1 rounded text-sm"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleResponse(r.id, "REJECT")}
                    className="text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-sm"
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">
          Accepted Friends ({acceptedFriends.length})
        </h3>
        {acceptedFriends.length === 0 ? (
          <p className="text-gray-500">
            You have no accepted friends. Send a request!
          </p>
        ) : (
          <ul className="space-y-2">
            {acceptedFriends.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between p-2 border-b last:border-b-0"
              >
                <span className="font-medium">@{r.username}</span>
                <Link
                  href={`/chat/${r.username}`}
                  className="text-blue-500 hover:underline text-sm"
                >
                  Start Chat
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border p-4 rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold mb-2">
          Sent Requests ({sentRequests.length})
        </h3>
        {sentRequests.length > 0 && (
          <ul className="space-y-2 text-sm text-gray-600">
            {sentRequests.map((r) => (
              <li key={r.id} className="p-1">
                @{r.username} (Pending)
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
