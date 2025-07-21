import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Gift, AlertCircle } from "lucide-react";
import axios from "axios";
import QRCode from "react-qr-code"; // default import from react-qr-code
import { useAuth } from "../components/AuthProvider";

const RewardsPage = () => {
  const { currentUser, loading } = useAuth();
  const [completionStatus, setCompletionStatus] = useState({
    allCompleted: false,
    completedCount: 0,
    totalCount: 0,
  });
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [qrToken, setQrToken] = useState("");
  const [error, setError] = useState("");
  const [localLoading, setLocalLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !currentUser) {
      navigate("/login"); // Redirect to login if not authenticated
    } else if (!loading && currentUser) {
      // Fetch completion status
      const fetchCompletionStatus = async () => {
        try {
          const response = await axios.get("/api/activities/check-completion", {
            params: { userId: currentUser.user_id },
            headers: { Authorization: `Bearer ${currentUser.accessToken}` },
          });
          setCompletionStatus(response.data);
        } catch (err) {
          setError(err.response?.data?.error || "Failed to check activity completion");
        }
      };
      fetchCompletionStatus();
    }
  }, [loading, currentUser, navigate]);

  useEffect(() => {
    if (!qrToken) return;
    const checkRewardStatus = async () => {
      try {
        const response = await axios.get(`/api/rewards/status?qrToken=${qrToken}`);
        if (response.data.data.isRedeemed) {
          setQrCodeUrl("");
          setQrToken("");
          setError("Reward has been redeemed!");
        }
      } catch (err) {
        console.error("Error checking reward status:", err);
      }
    };
    const interval = setInterval(checkRewardStatus, 5000);
    return () => clearInterval(interval);
  }, [qrToken]);

  const handleClaimReward = async () => {
    setError("");
    setLocalLoading(true);
    try {
      const response = await axios.post(
        "/api/rewards/generate",
        {},
        { headers: { Authorization: `Bearer ${currentUser.accessToken}` } }
      );
      setQrCodeUrl(response.data.data.qrCodeUrl);
      // Extract qrToken from URL
      const urlParams = new URL(response.data.data.qrCodeUrl).searchParams;
      setQrToken(urlParams.get("qrToken") || "");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to generate reward");
    } finally {
      setLocalLoading(false);
    }
  };

  const isButtonEnabled = completionStatus.allCompleted && !qrCodeUrl && !localLoading;

  if (loading) {
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
          Claim Your Reward
        </h2>

        {error && (
          <div className="bg-red-700/70 text-red-200 rounded-md p-3 mb-4 flex items-center gap-2">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="text-center text-gray-300 mb-6">
          {completionStatus.allCompleted ? (
            <p>
              Congratulations! You've completed all activities (
              {completionStatus.completedCount}/{completionStatus.totalCount}).
            </p>
          ) : (
            <p>
              Please complete all activities ({completionStatus.completedCount}/
              {completionStatus.totalCount} completed).
            </p>
          )}
        </div>

        {qrCodeUrl ? (
          <div className="flex justify-center mb-6 bg-white p-4 rounded-lg">
            <QRCode value={qrCodeUrl} size={256} />
          </div>
        ) : (
          <button
            onClick={handleClaimReward}
            disabled={!isButtonEnabled}
            className={`w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-full shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 font-semibold flex justify-center items-center gap-2 ${
              !isButtonEnabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {localLoading ? "Generating Reward..." : "Claim Reward"}
            <Gift className="animate-pulse" />
          </button>
        )}

        <p className="mt-6 text-center text-gray-400">
          Back to{" "}
          <button
            onClick={() => navigate("/scan")}
            className="text-purple-400 hover:text-purple-600 font-semibold underline"
          >
            Scan
          </button>
        </p>
      </div>
    </div>
  );
};

export default RewardsPage;
