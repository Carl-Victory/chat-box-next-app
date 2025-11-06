"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

interface OnboardingFormProps {
  userId: string;
}

export default function OnboardingForm({ userId }: OnboardingFormProps) {
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const router = useRouter();
  const { data: session, update: updateSession } = useSession();

  useEffect(() => {
    const isValid = username.trim() !== "";
    setIsFormValid(isValid);
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);
    setIsLoading(true);

    if (
      !username ||
      username.length < 3 ||
      !/^[a-zA-Z0-9_]{3,20}$/.test(username)
    ) {
      setIsError(true);
      setMessage(
        "Username must be 3-20 characters long and contain only letters, numbers, or underscores."
      );
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      const data = await res.json();
      console.log("updatedData:", data);
      if (!res.ok || !data.ok) {
        setIsError(true);
        setMessage(data.error || "Failed to update username.");
        setIsLoading(false);
        return;
      }

      // Update the session with the new username
      await updateSession({
        ...session,
        user: {
          ...session?.user,
          username: username,
        },
      });

      setMessage("Username set successfully! Redirecting to dashboard...");
      router.refresh(); // Refresh session data and trigger server-side redirects
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      setIsError(true);
      setMessage("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const buttonClasses = `
  w-full mt-5 rounded-2xl   py-4 font-medium
    ${
      isFormValid
        ? "bg-teal-700 hover:bg-teal-400 text-white cursor-pointer"
        : "bg-neutral-200 text-neutral-800 cursor-not-allowed"
    }
  `;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="text-green-900 text-sm">Enter unique username</p>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          disabled={isLoading}
          className="w-full p-2 border-b-1"
        />
      </div>
      <button
        type="submit"
        disabled={isLoading || username.length < 3}
        className={buttonClasses}
      >
        {isLoading ? "Setting Username..." : "Set Username and Continue"}
      </button>

      {message && (
        <p
          className={`p-3 rounded-lg text-sm ${
            isError ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
          }`}
        >
          {message}
        </p>
      )}

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="text-sm  text-teal-700 w-full hover:text-teal-900 mt-2"
      >
        Sign Out
      </button>
    </form>
  );
}
