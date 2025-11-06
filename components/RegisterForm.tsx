"use client";
import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { IoArrowBackSharp } from "react-icons/io5";
import { redirect } from "next/navigation";

export default function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    const isValid = email.trim() !== "" && password.trim() !== "";
    setIsFormValid(isValid);
  }, [email, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    try {
      const registerRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await registerRes.json();

      if (!registerRes.ok || !data.ok) {
        setIsError(true);
        setMessage(data.error || "Registration failed.");
        return;
      }

      setMessage("Registration successful! Logging you in...");

      const loginRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (loginRes?.error) {
        setIsError(true);
        setMessage(
          "Registration successful, but automatic login failed. Please log in manually."
        );
      } else if (loginRes?.ok) {
        window.location.href = loginRes.url || "/dashboard";
      }
    } catch (error) {
      setIsError(true);
      setMessage("An unknown error occurred.");
      console.error(error);
    }
  };

  const returnToPreviousPage = () => {
    redirect("/");
  };

  const buttonClasses = `
  w-full mt-30 rounded-2xl   py-4 font-medium
    ${
      isFormValid
        ? "bg-teal-700 hover:bg-teal-400 text-white cursor-pointer"
        : "bg-neutral-200 text-neutral-800 cursor-not-allowed"
    }
  `;

  return (
    <div className="relative max-w-md mx-6 flex flex-col items-center justify-center">
      <div className="absolute top-6 left-0">
        <button onClick={returnToPreviousPage}>
          <IoArrowBackSharp />
        </button>
      </div>
      <h1 className="mt-24 font-bold text-lg">Sign up with Email</h1>
      <p className=" text-center mt-4 text-neutral-500 text-sm ">
        Get started chatting with friends and family today by <br /> signing up
        on ChatBox
      </p>
      <form onSubmit={handleSubmit} className="w-full mt-8">
        <div>
          <p className="text-green-900 text-sm">Your email</p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-2 border-b-1"
          />
        </div>
        <div className="mt-7">
          <p className="text-green-900 text-sm">Your password</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-2 border-b-1"
          />
        </div>
        <button type="submit" className={buttonClasses}>
          Register
        </button>

        {message && (
          <p
            className={`p-2 rounded text-sm ${
              isError
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
