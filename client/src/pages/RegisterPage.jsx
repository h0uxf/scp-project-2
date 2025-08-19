import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../components/AuthProvider";
import BackgroundEffects from "../components/BackgroundEffects";

const RegisterPage = () => {
  const { handleRegister } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await handleRegister({ username, password });
      setSuccess("Registration successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      console.error("Register failed:", error);
      console.log("Error object:", { message: error.message, status: error.status });
      setError(
        error.message && typeof error.message === "string"
          ? error.message
          : "Registration failed. Please try a different username or email."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-sans bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 min-h-screen scroll-smooth relative overflow-hidden">
      <BackgroundEffects />
      <div className="font-sans bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 min-h-screen flex flex-col justify-center items-center px-4 sm:px-8 relative overflow-hidden">
        <div className="max-w-md w-full bg-black/70 backdrop-blur-lg rounded-3xl p-10 border border-white/20 shadow-2xl animate-fadeInUp">
          <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent text-center">
            Create a New Account
          </h2>

          {error && (
            <div className="bg-red-700/70 text-red-200 rounded-md p-3 mb-4 flex items-center gap-2">
              <XCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-700/70 text-green-200 rounded-md p-3 mb-4 flex items-center gap-2">
              <CheckCircle size={20} />
              <span>{success}</span>
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
                placeholder="Choose a username"
                required
              />
            </label>

            <label className="block text-gray-300 font-semibold">
              Password
              <div className="relative mt-2">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 pr-12 bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter a password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </label>

            <label className="block text-gray-300 font-semibold">
              Confirm Password
              <div className="relative mt-2">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 pr-12 bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-full shadow-lg hover:shadow-pink-500/50 transition-all duration-300 hover:scale-105 font-semibold flex justify-center items-center gap-2"
            >
              {loading ? "Registering..." : "Register"}
              <UserPlus className="animate-pulse" />
            </button>
          </form>

          <p className="mt-6 text-center text-gray-400">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-pink-400 hover:text-pink-600 font-semibold underline"
            >
              Login here
            </button>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
};

export default RegisterPage;
