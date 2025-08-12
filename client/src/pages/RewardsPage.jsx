import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Gift, AlertCircle, X, Download } from "lucide-react";
import { useAuth } from "../components/AuthProvider";
import BackgroundEffects from "../components/BackgroundEffects";
import toast, { Toaster } from "react-hot-toast";
import useApi from "../hooks/useApi";

const ErrorBanner = ({ message, onClose }) => {
  if (!message) return null;
  return (
    <div className="bg-red-700/70 text-red-200 rounded-md p-3 sm:p-4 mb-4 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <AlertCircle size={16} />
        <span className="text-sm sm:text-base">{message}</span>
      </div>
      <button
        onClick={onClose}
        className="text-red-200 hover:text-red-100"
        aria-label="Dismiss error"
      >
        <X size={16} />
      </button>
    </div>
  );
};

const QRCodeDisplay = ({ image, token, onDownload }) => {
  if (!image) return null;
  return (
    <div className="flex flex-col items-center mb-4 sm:mb-6">
      <div className="bg-white p-4 rounded-lg">
        <img src={image} alt="Reward QR Code" className="w-[200px] h-[200px]" />
      </div>
      <button
        onClick={onDownload}
        className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-full shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 font-semibold flex items-center gap-2 text-sm sm:text-base"
        aria-label="Download QR Code"
      >
        Download QR Code
        <Download size={16} />
      </button>
    </div>
  );
};

const RewardsPage = () => {
  const { currentUser, loading } = useAuth();
  const { makeApiCall, loading: apiLoading, error: apiError } = useApi();
  const [completionStatus, setCompletionStatus] = useState({
    allCompleted: false,
    completedCount: 0,
    totalCount: 0,
  });
  const [qrCodeImage, setQrCodeImage] = useState("");
  const [qrToken, setQrToken] = useState("");
  const [hasRedeemed, setHasRedeemed] = useState(false);
  const [localError, setLocalError] = useState("");
  const navigate = useNavigate();

  const clearError = () => setLocalError("");

  // Fetch completion and reward status in parallel
  const fetchRewardStatus = async () => {
    try {
      const completionResponse = await makeApiCall("/activities/check-completion", "GET");

      if (completionResponse.status === "success") {
        setCompletionStatus(completionResponse.data);
      } else {
        throw new Error(completionResponse.message || "Failed to fetch completion status");
      }

      // Call /rewards/status WITHOUT qrToken query param
      const rewardResponse = await makeApiCall("/rewards/status", "GET");

      if (rewardResponse.status === "success") {
        const { qrToken, isRedeemed, qrCodeUrl, hasRewardAssigned } = rewardResponse.data;
        
        // UPDATED LOGIC: Check if user has ever redeemed
        if (isRedeemed) {
          setHasRedeemed(true);
          setLocalError("You have already redeemed your reward!");
          setQrCodeImage("");
          setQrToken("");
        } else if (hasRewardAssigned && qrToken && qrCodeUrl) {
          // User has an active unredeemed reward
          setQrToken(qrToken);
          setQrCodeImage(qrCodeUrl);
          setHasRedeemed(false);
        } else {
          // No reward assigned yet
          setQrToken("");
          setQrCodeImage("");
          setHasRedeemed(false);
        }
      } else {
        // Clear if no reward data
        setQrToken("");
        setQrCodeImage("");
        setHasRedeemed(false);
      }
    } catch (err) {
      console.error("Error fetching status:", err);
      toast.error(err.message || "Unable to check activity or reward status. Please try again.");
    }
  };

  useEffect(() => {
    if (!loading && !currentUser) {
      navigate("/login");
      return;
    }

    if (!loading && currentUser) {
      fetchRewardStatus();
    }
  }, [loading, currentUser, navigate, makeApiCall]);

  // Poll reward status if QR token exists
  useEffect(() => {
    if (!qrToken || hasRedeemed || typeof qrToken !== "string" || qrToken.trim() === "") return;
    let attempts = 0;

    const checkRewardStatus = async () => {
      attempts++;
      if (attempts > 12) return clearInterval(interval); // stop after 1 min

      try {
        const response = await makeApiCall(`/rewards/status?qrToken=${encodeURIComponent(qrToken)}`, "GET");
        if (response.status === "success" && response.data.isRedeemed) {
          setQrCodeImage("");
          setQrToken("");
          setHasRedeemed(true);
          setLocalError("You have already redeemed your reward!");
          toast.error("Reward has been redeemed!");
          clearInterval(interval);
          // Immediately refresh reward status
          fetchRewardStatus();
        }
      } catch (err) {
        console.error("Error checking reward status:", err);
        toast.error(err.message || "Failed to verify reward status. Please try again.");
      }
    };

    const interval = setInterval(checkRewardStatus, 5000);
    return () => clearInterval(interval);
  }, [qrToken, hasRedeemed, makeApiCall]);

  const handleClaimReward = async () => {
    setLocalError("");
    try {
      const response = await makeApiCall("/rewards/generate", "POST", {});
      if (response.status !== "success") {
        throw new Error(response.message || "Failed to generate reward");
      }
      setQrCodeImage(response.data.qrCodeUrl);
      setQrToken(response.data.qrToken || "");
      toast.success("Reward QR code generated successfully!");
    } catch (err) {
      console.error("Error generating reward:", err);
      
      // UPDATED ERROR HANDLING: Handle both 403 cases properly
      if (err.response?.status === 403) {
        if (err.response?.data?.message?.includes("already redeemed")) {
          // User has already redeemed a reward
          setHasRedeemed(true);
          setLocalError("You have already redeemed a reward and cannot generate another one.");
          toast.error("You have already redeemed a reward!");
        } else {
          // Activities not completed
          toast.error("All activities must be completed to generate a reward.");
        }
      } else {
        toast.error(err.message || "Failed to generate reward. Please try again.");
      }
    }
  };

  const handleDownloadQRCode = () => {
    if (!qrCodeImage) {
      toast.error("QR code not found!");
      return;
    }
    const downloadLink = document.createElement("a");
    downloadLink.href = qrCodeImage;
    downloadLink.download = `reward-qr-code-${qrToken || "reward"}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    toast.success("QR code downloaded successfully!");
  };

  const canClaimReward = completionStatus.allCompleted && !apiLoading && !hasRedeemed && !qrCodeImage;

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
    <div className="font-sans bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 min-h-screen relative overflow-hidden">
      <BackgroundEffects />
      <div className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-8 relative overflow-hidden">
        <Toaster position="top-right" />
        <div className="max-w-md w-full bg-black/70 backdrop-blur-lg rounded-3xl p-6 sm:p-10 border border-white/20 shadow-2xl animate-fadeInUp">
          <h2 className="text-2xl sm:text-4xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent text-center">
            Claim Your Reward
          </h2>

          <ErrorBanner message={localError || apiError} onClose={clearError} />

          <div className="text-center text-gray-300 mb-4 sm:mb-6 text-sm sm:text-base" aria-live="polite">
            {completionStatus.allCompleted ? (
              <p>
                Congratulations! You've completed all activities (
                {completionStatus.completedCount}/{completionStatus.totalCount}){" "}
                <br />
                <br />
                {hasRedeemed
                  ? "You have already redeemed your reward."
                  : qrCodeImage
                  ? "Please head to the vending machine beside Food Court 6 (on the second floor) to redeem your reward, or download your QR code to save it."
                  : "You are eligible for a reward! Click the button below to claim it."}
              </p>
            ) : (
              <p>
                Please complete all activities (
                {completionStatus.completedCount}/{completionStatus.totalCount} completed).
              </p>
            )}
          </div>

          {!hasRedeemed && (
            <QRCodeDisplay image={qrCodeImage} token={qrToken} onDownload={handleDownloadQRCode} />
          )}

          <button
            onClick={handleClaimReward}
            disabled={!canClaimReward}
            className={`w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 sm:py-4 rounded-full shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 font-semibold flex justify-center items-center gap-2 text-sm sm:text-base ${
              !canClaimReward ? "opacity-50 cursor-not-allowed" : ""
            }`}
            aria-label={apiLoading ? "Generating Reward" : "Claim Reward"}
          >
            {apiLoading ? "Generating Reward..." : "Claim Reward"}
            <Gift className="animate-pulse" size={16} />
          </button>

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
