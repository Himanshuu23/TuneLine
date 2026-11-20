"use client";

import { useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import GoogleLogo from "../logos/Google";
import GithubLogo from "../logos/Github";

const modalPanel =
  "block bg-black border border-white/25 rounded-2xl sm:rounded-2xl p-8 w-[90vw] sm:w-[420px] shadow-2xl";
const modalTitle =
  "text-white text-center mb-6 font-semibold text-xl tracking-wide";
const modalDivider = "text-white/40 text-center text-xs my-5 tracking-widest";
const modalInput =
  "w-full px-4 py-2.5 rounded-xl bg-black border border-white/25 text-white text-sm placeholder:text-white/35 focus:outline-none focus:border-white/60 transition-colors";
const modalPrimaryButton =
  "w-full py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors";
const modalLink =
  "block w-full text-white/70 text-sm text-center mt-5 hover:text-white transition-colors";
const oauthButton =
  "flex items-center justify-center w-12 h-12 rounded-xl border border-white/25 hover:border-white/50 hover:bg-white/5 transition-colors";

export default function Login() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (provider: string) => {
    signIn(provider, { callbackUrl: window.location.href });
  };

  const handleEmailSubmit = () => {
    setError("Email sign-in isn't available yet. Use Google or GitHub.");
  };

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) {
      setShowSignUp(false);
      setError("");
    }
  };

  if (session) {
    return (
      <div>
        <button
          className="px-3 py-2 text-sm mb-2 font-medium text-white bg-black rounded-full hover:bg-gray-900"
          onClick={() => signOut()}
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger className="px-4 h-8 text-sm font-medium text-gray-800 bg-gray-200 border border-gray-300 rounded-full hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400">
        Login
      </DialogTrigger>
      <DialogContent className={modalPanel}>
        {showSignUp ? (
          <>
            <DialogHeader>
              <DialogTitle className={modalTitle}>Sign Up</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                type="text"
                placeholder="Full Name"
                className={modalInput}
              />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="Email"
                className={modalInput}
              />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="Create a strong Password"
                className={modalInput}
              />
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button
                onClick={handleEmailSubmit}
                className={modalPrimaryButton}
                type="button"
              >
                Sign Up
              </button>
            </div>
            <button
              onClick={() => {
                setShowSignUp(false);
                setError("");
              }}
              className={modalLink}
              type="button"
            >
              Already have an account? <span className="underline">Login</span>
            </button>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className={modalTitle}>Login</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center gap-4 mb-2">
              <button
                onClick={() => handleLogin("google")}
                className={oauthButton}
                type="button"
                aria-label="Login with Google"
              >
                <div className="transform scale-110">
                  <GoogleLogo />
                </div>
              </button>
              <button
                onClick={() => handleLogin("github")}
                className={oauthButton}
                type="button"
                aria-label="Login with GitHub"
              >
                <div className="transform scale-110">
                  <GithubLogo />
                </div>
              </button>
            </div>
            <div className={modalDivider}>OR</div>
            <div className="flex flex-col gap-3">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="Email"
                className={modalInput}
              />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="Password"
                className={modalInput}
              />
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button
                onClick={handleEmailSubmit}
                className={modalPrimaryButton}
                type="button"
              >
                Login
              </button>
            </div>
            <button
              onClick={() => {
                setShowSignUp(true);
                setError("");
              }}
              className={modalLink}
              type="button"
            >
              Don&apos;t have an account? <span className="underline">Sign up</span>
            </button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
