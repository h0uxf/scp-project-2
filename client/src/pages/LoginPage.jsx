import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, XCircle } from "lucide-react";
import { useAuth } from "../components/AuthProvider";

const LoginPage = () => {
  const { handleLogin, currentUser, authLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect to /quiz if user is already authenticated
  useEffect(() => {
    if (!authLoading && currentUser) {
      navigate("/quiz");
    }
  }, [authLoading, currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await handleLogin({ username, password });
      navigate("/quiz");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = username.trim() && password.trim();

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col justify-center items-center px-4 sm:px-8">
        <h1 className="text-4xl font-bold text-white mb-4">Loading...</h1>
      </div>
    );
  }

  return (
    <div className="font-sans bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 min-h-screen flex flex-col justify-center items-center px-4 sm:px-8 relative overflow-hidden">
      <div className="max-w-md w-full bg-black/70 backdrop-blur-lg rounded-3xl p-10 border border-white/20 shadow-2xl animate-fadeInUp">
        <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent text-center">
          Login to Your Account
        </h2>

        {error && (
          <div className="bg-red-700/70 text-red-200 rounded-md p-3 mb-4 flex items-center gap-2">
            <XCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <label className="block text-gray-300 font-semibold">
            Username
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-2 w-full rounded-xl px-4 py-3 bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter your username"
              required
            />
          </label>

          <label className="block text-gray-300 font-semibold">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-xl px-4 py-3 bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter your password"
              required
            />
          </label>

          <button
            type="submit"
            disabled={loading || !isFormValid}
            className={`w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-full shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 font-semibold flex justify-center items-center gap-2 ${
              loading || !isFormValid ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Logging in..." : "Login"}
            <LogIn className="animate-pulse" />
          </button>
        </form>

        <p className="mt-6 text-center text-gray-400">
          Don't have an account?{" "}
          <button
            onClick={() => navigate("/register")}
            className="text-purple-400 hover:text-purple-600 font-semibold underline"
          >
            Register here
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
