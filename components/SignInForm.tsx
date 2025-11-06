"use client";
import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import ThemeToggle from "./ToggleTheme";
import { FaApple, FaGithub } from "react-icons/fa";
import { IoArrowBackSharp } from "react-icons/io5";

export default function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const isValid = email.trim() !== "" && password.trim() !== "";
    setIsFormValid(isValid);
  }, [email, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    try {
      const loginRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (loginRes?.error) {
        console.log("Login error:", loginRes.error);
        setIsError(true);
        setMessage("Something went wrong. Try again");
      } else if (loginRes?.ok) {
        router.push(loginRes.url || "/dashboard");
      }
    } catch (error) {
      setIsError(true);
      setMessage("An unknown error occurred.");
      console.error(error);
    }
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
    <div>
      <div className="relative max-w-md mx-6 flex flex-col items-center justify-center">
        <div className="absolute top-6 left-0">
          <IoArrowBackSharp />
        </div>
        <h1 className="mt-24 font-bold text-lg">Login to ChatBox</h1>
        <p className=" text-center mt-4 text-neutral-500 text-sm ">
          Welcome back! Sign in using your social <br /> account or email to
          continue{" "}
        </p>
        <div className="flex justify-center gap-5 mt-7">
          <button
            type="submit"
            className=" rounded-full bg-white flex items-center justify-center border-1 border-b-black w-12 h-12"
            onClick={() => signIn("google")}
          >
            <FcGoogle size={24} />
          </button>

          <button
            type="submit"
            className=" rounded-full bg-white flex items-center justify-center border-1 border-b-black w-12 h-12"
            onClick={() => signIn("github")}
          >
            <FaGithub size={24} />
          </button>
          <button
            type="submit"
            className=" rounded-full bg-white flex items-center justify-center border-1 border-b-black w-12 h-12"
            onClick={() => signIn("github")}
          >
            <FaApple size={24} />
          </button>
        </div>
        <div className="flex items-center w-full my-7 ">
          <div className="flex-grow border-t border-neutral-300 dark:border-gray-600"></div>

          <span className="flex-shrink mx-4 text-neutral-400 dark:text-gray-400 text-sm font-medium">
            OR
          </span>

          <div className="flex-grow border-t border-neutral-300 dark:border-gray-600"></div>
        </div>
        <form onSubmit={handleSubmit} className="w-full">
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
            Log in
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

      <div>
        <Link href={"/signup"}>
          <p className="text-sm pt-4 text-center text-teal-500">
            Not already registered? Sign Up with Email.
          </p>
        </Link>
      </div>
    </div>
  );
}
