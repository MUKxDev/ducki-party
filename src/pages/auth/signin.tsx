import { useState } from "react";
import type { NextPage } from "next";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import Head from "next/head";
import { toast, Toaster } from "react-hot-toast";

const SignInPage: NextPage = () => {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  
  // Form States
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);

    if (isRegister) {
      if (password !== confirmPassword) {
        toast.error("Passwords do not match");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });

        const data = (await response.json()) as { message?: string };

        if (!response.ok) {
          throw new Error(data.message || "Registration failed");
        }

        toast.success("Account created successfully! Logging in...");
        
        // Auto sign in after registration
        const result = await signIn("credentials", {
          redirect: false,
          username,
          password,
        });

        if (result?.error) {
          toast.error(result.error);
          setIsRegister(false); // send to login if auto-login fails
        } else {
          void router.push("/");
        }
      } catch (err) {
        const error = err as Error;
        toast.error(error.message || "Something went wrong during registration");
      } finally {
        setLoading(false);
      }
    } else {
      try {
        const result = await signIn("credentials", {
          redirect: false,
          username,
          password,
        });

        if (result?.error) {
          toast.error(result.error || "Invalid username or password");
        } else {
          toast.success("Logged in successfully!");
          void router.push("/");
        }
      } catch (err) {
        toast.error("Failed to sign in");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <>
      <Head>
        <title>{isRegister ? "Register - Ducki Party" : "Sign In - Ducki Party"}</title>
      </Head>
      <Toaster />
      <div 
        className="flex min-h-screen items-center justify-center p-4"
        style={{
          background: "radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)",
        }}
      >
        <div className="card w-full max-w-md bg-slate-900/60 shadow-2xl backdrop-blur-md border border-slate-700/30">
          <div className="card-body gap-6 p-8">
            <div className="flex flex-col items-center text-center">
              <span className="text-6xl mb-2 animate-bounce">🐥</span>
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-500 bg-clip-text text-transparent">
                Ducki Party
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                {isRegister ? "Join the party & hang out together" : "Sign in to join the lobby"}
              </p>
            </div>

            {/* Tab Selection */}
            <div className="tabs tabs-boxed justify-center bg-slate-800/40 p-1 border border-slate-700/20">
              <button 
                type="button"
                className={`tab tab-lg rounded-lg transition-all duration-200 ${!isRegister ? "tab-active bg-yellow-500 text-slate-900 font-bold" : "text-slate-400"}`}
                onClick={() => {
                  setIsRegister(false);
                  setUsername("");
                  setPassword("");
                }}
              >
                Sign In
              </button>
              <button 
                type="button"
                className={`tab tab-lg rounded-lg transition-all duration-200 ${isRegister ? "tab-active bg-yellow-500 text-slate-900 font-bold" : "text-slate-400"}`}
                onClick={() => {
                  setIsRegister(true);
                  setUsername("");
                  setPassword("");
                  setConfirmPassword("");
                }}
              >
                Register
              </button>
            </div>

            <form onSubmit={(e) => { void handleSubmit(e); }} className="flex flex-col gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-slate-300">Username</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. ducki_lover"
                  className="input input-bordered focus:input-warning bg-slate-950/40 border-slate-700/50 text-slate-200 transition-all"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-slate-300">Password</span>
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="input input-bordered focus:input-warning bg-slate-950/40 border-slate-700/50 text-slate-200 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              {isRegister && (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold text-slate-300">Confirm Password</span>
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="input input-bordered focus:input-warning bg-slate-950/40 border-slate-700/50 text-slate-200 transition-all"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                className={`btn btn-warning mt-4 text-slate-900 font-bold ${loading ? "loading" : ""}`}
                disabled={loading}
              >
                {isRegister ? "Create Account" : "Let's Go!"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default SignInPage;
