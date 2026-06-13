import { useState } from "react";
import type { NextPage } from "next";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import Head from "next/head";
import { toast } from "react-hot-toast";
import { useAppContext } from "../../context/AppContext";

const SignInPage: NextPage = () => {
  const router = useRouter();
  const { darkMode, updateDarkMode } = useAppContext();
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

        toast.success("Account created! Logging in...");
        
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
          toast.success("Welcome to the party!");
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
      <div 
        className={`relative flex min-h-screen items-center justify-center p-4 transition-colors duration-300 ${
          darkMode ? "bg-cosmic-grid text-slate-100" : "bg-cosmic-grid-light text-slate-900"
        }`}
        data-theme={darkMode ? "ducki-dark" : "ducki-light"}
      >
        {/* Floating Theme Switcher */}
        <div className="absolute top-4 right-4 z-50">
          <button
            type="button"
            onClick={() => updateDarkMode(!darkMode)}
            className={`btn btn-circle btn-ghost ${darkMode ? "text-yellow-400" : "text-amber-600"}`}
            title="Toggle Theme"
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>

        <div className={`card w-full max-w-md shadow-2xl border transition-all duration-300 hover:shadow-yellow-500/5 ${
          darkMode ? "glass-panel text-slate-100" : "glass-panel-light text-slate-900"
        }`}>
          <div className="card-body gap-6 p-8">
            <div className="flex flex-col items-center text-center">
              <span className="text-6xl mb-2 animate-float inline-block">🐥</span>
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-500 bg-clip-text text-transparent">
                Ducki Party
              </h1>
              <p className={`text-sm mt-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                {isRegister ? "Join the party & hang out together" : "Sign in to join the lobby"}
              </p>
            </div>

            {/* Tab Selection */}
            <div className={`tabs tabs-boxed justify-center p-1 border ${
              darkMode ? "bg-slate-950/40 border-slate-800" : "bg-slate-100 border-slate-200"
            }`}>
              <button 
                type="button"
                className={`tab tab-lg grow rounded-lg transition-all duration-200 ${
                  !isRegister 
                    ? "tab-active bg-primary text-slate-950 font-bold glow-primary" 
                    : darkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-800"
                }`}
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
                className={`tab tab-lg grow rounded-lg transition-all duration-200 ${
                  isRegister 
                    ? "tab-active bg-primary text-slate-950 font-bold glow-primary" 
                    : darkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-800"
                }`}
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
                  <span className={`label-text font-semibold ${darkMode ? "text-slate-300" : "text-slate-700"}`}>Username</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. ducki_lover"
                  className={`input input-bordered focus:input-primary transition-all duration-200 ${
                    darkMode 
                      ? "bg-slate-950/40 border-slate-700/50 text-slate-200" 
                      : "bg-white border-slate-300 text-slate-900"
                  }`}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className={`label-text font-semibold ${darkMode ? "text-slate-300" : "text-slate-700"}`}>Password</span>
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className={`input input-bordered focus:input-primary transition-all duration-200 ${
                    darkMode 
                      ? "bg-slate-950/40 border-slate-700/50 text-slate-200" 
                      : "bg-white border-slate-300 text-slate-900"
                  }`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              {isRegister && (
                <div className="form-control">
                  <label className="label">
                    <span className={`label-text font-semibold ${darkMode ? "text-slate-300" : "text-slate-700"}`}>Confirm Password</span>
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className={`input input-bordered focus:input-primary transition-all duration-200 ${
                      darkMode 
                        ? "bg-slate-950/40 border-slate-700/50 text-slate-200" 
                        : "bg-white border-slate-300 text-slate-900"
                    }`}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                className={`btn btn-primary mt-4 text-slate-950 font-bold shadow-lg glow-primary hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 ${
                  loading ? "loading" : ""
                }`}
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
