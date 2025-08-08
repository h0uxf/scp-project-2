import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Gift, AlertCircle, X } from "lucide-react";
import QRCode from "react-qr-code";
import { useAuth } from "../components/AuthProvider";
import BackgroundEffects from "../components/BackgroundEffects";
import toast, { Toaster } from "react-hot-toast";
import useApi from "../hooks/useApi";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const RewardsPage = () => {
  const { currentUser, loading } = useAuth();
  const { makeApiCall, loading: apiLoading, error: apiError } = useApi();
  const [completionStatus, setCompletionStatus] = useState({
    allCompleted: false,
    completedCount: 0,
    totalCount: 0,
  });
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [qrToken, setQrToken] = useState("");
  const [hasRedeemed, setHasRedeemed] = useState(false);
  const [localError, setLocalError] = useState("");
  const navigate = useNavigate();

  // Clear error message
  const clearError = () => {
    setLocalError("");
  };

  useEffect(() => {
    if (!loading && !currentUser) {
      navigate("/login");
    } else if (!loading && currentUser) {
      const fetchCompletionAndRewardStatus = async () => {
        try {
          // Fetch completion status
          const completionResponse = await makeApiCall("/activities/check-completion", "GET");
          if (completionResponse.status !== "success") {
            throw new Error(completionResponse.message || "Failed to fetch completion status");
          }
          setCompletionStatus(completionResponse.data);

          if (qrToken) {
            const rewardStatusResponse = await makeApiCall(`/rewards/status?qrToken=${qrToken}`, "GET");
            if (rewardStatusResponse.status !== "success") {
              throw new Error(rewardStatusResponse.message || "Failed to fetch reward status");
            }
            setHasRedeemed(rewardStatusResponse.data.isRedeemed || false);
            if (rewardStatusResponse.data.isRedeemed) {
              setLocalError("You have already redeemed your reward!");
            }
          }
        } catch (err) {
          console.error("Error fetching status:", {
            message: err.message,
            status: err.response?.status,
            data: err.response?.data,
            url: err.config?.url,
          });
          toast.error(
            err.message || "Unable to check activity or reward status. Please try again later.",
            { style: { fontSize: "14px", padding: "8px 16px" } }
          );
        }
      };
      fetchCompletionAndRewardStatus();
    }
  }, [loading, currentUser, navigate, qrToken, makeApiCall]);

  useEffect(() => {
    if (!qrToken || hasRedeemed) return;
    const checkRewardStatus = async () => {
      try {
        const response = await makeApiCall(`/rewards/status?qrToken=${qrToken}`, "GET");
        if (response.status !== "success") {
          throw new Error(response.message || "Failed to verify reward status");
        }
        if (response.data.isRedeemed) {
          setQrCodeUrl("");
          setQrToken("");
          setHasRedeemed(true);
          toast.error("Reward has been redeemed!", {
            style: { fontSize: "14px", padding: "8px 16px" },
          });
        }
      } catch (err) {
        console.error("Error checking reward status:", {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
          url: err.config?.url,
        });
        toast.error(
          err.message || "Failed to verify reward status. Please try again.",
          { style: { fontSize: "14px", padding: "8px 16px" } }
        );
      }
    };
    const interval = setInterval(checkRewardStatus, 5000);
    return () => clearInterval(interval);
  }, [qrToken, hasRedeemed, makeApiCall]);

  const handleClaimReward = async () => {
    setLocalError("");
    try {
      // CSRF-protected POST request
      const response = await makeApiCall("/rewards/generate", "POST", {});
      if (response.status !== "success") {
        throw new Error(response.message || "Failed to generate reward");
      }
      setQrCodeUrl(response.data.qrCodeUrl);
      const urlParams = new URL(response.data.qrCodeUrl).searchParams;
      setQrToken(urlParams.get("qrToken") || "");
      toast.success("Reward QR code generated successfully!", {
        style: { fontSize: "14px", padding: "8px 16px" },
      });
    } catch (err) {
      console.error("Error generating reward:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        url: err.config?.url,
      });
      if (err.message.includes("409")) {
        toast.error("You have already claimed and redeemed your reward!", {
          style: { fontSize: "14px", padding: "8px 16px" },
        });
        setHasRedeemed(true);
      } else {
        toast.error(
          err.message || "Failed to generate reward. Please try again.",
          { style: { fontSize: "14px", padding: "8px 16px" } }
        );
      }
    }
  };

  const isButtonEnabled =
    completionStatus.allCompleted &&
    !qrCodeUrl &&
    !apiLoading &&
    !hasRedeemed;

  if (loading || apiLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col justify-center items-center px-4 sm:px-8">
        <Toaster position="top-right" />
        <h1 className="text-2xl sm:text-4xl font-bold text-white mb-4" aria-live="polite">
          Loading...
        </h1>
      </div>
    );
  }

  return (
    <div className="font-sans bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 min-h-screen scroll-smooth relative overflow-hidden">
      <BackgroundEffects />
      <div className="font-sans bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 min-h-screen flex flex-col justify-center items-center px-4 sm:px-8 relative overflow-hidden">
        <Toaster position="top-right" />
        <div className="max-w-md w-full bg-black/70 backdrop-blur-lg rounded-3xl p-6 sm:p-10 border border-white/20 shadow-2xl animate-fadeInUp">
          <h2 className="text-2xl sm:text-4xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent text-center">
            Claim Your Reward
          </h2>

          {(localError || apiError) && (
            <div className="bg-red-700/70 text-red-200 rounded-md p-3 sm:p-4 mb-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} />
                <span className="text-sm sm:text-base">{localError || apiError}</span>
              </div>
              <button
                onClick={clearError}
                className="text-red-200 hover:text-red-100"
                aria-label="Dismiss error"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <div className="text-center text-gray-300 mb-4 sm:mb-6 text-sm sm:text-base" aria-live="polite">
            {completionStatus.allCompleted ? (
              <p>
                Congratulations! You've completed all activities (
                {completionStatus.completedCount}/{completionStatus.totalCount}){" "}
                <br />
                <br />
                {hasRedeemed
                  ? "You have already claimed and redeemed your reward."
                  : "Please head to the vending machine beside Food Court 6 (on the second floor) to claim your reward."}
              </p>
            ) : (
              <p>
                Please complete all activities (
                {completionStatus.completedCount}/{completionStatus.totalCount}{" "}
                completed).
              </p>
            )}
          </div>

          {qrCodeUrl ? (
            <div className="flex justify-center mb-4 sm:mb-6 bg-white p-4 rounded-lg">
              <QRCode value={qrCodeUrl} size={200} />
            </div>
          ) : (
            <button
              onClick={handleClaimReward}
              disabled={!isButtonEnabled}
              className={`w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 sm:py-4 rounded-full shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 font-semibold flex justify-center items-center gap-2 text-sm sm:text-base ${
                !isButtonEnabled ? "opacity-50 cursor-not-allowed" : ""
              }`}
              aria-label={apiLoading ? "Generating Reward" : "Claim Reward"}
            >
              {apiLoading ? "Generating Reward..." : "Claim Reward"}
              <Gift className="animate-pulse" size={16} />
            </button>
          )}

          <p className="mt-4 sm:mt-6 text-center text-gray-400 text-sm sm:text-base">
            Back to{" "}
            <button
              onClick={() => navigate("/scan")}
              className="text-purple-400 hover:text-purple-600 font-semibold underline"
              aria-label="Navigate to scan page"
            >
              Scan
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RewardsPage;