import React, { useState, useEffect, useRef, useCallback } from "react";
import jsQR from "jsqr";
import { Camera, CheckCircle, XCircle, Users, Gift, AlertCircle, Scan, RefreshCw, X } from "lucide-react";
import { useAuth } from "../components/AuthProvider";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import useApi from "../hooks/useApi";

const AdminQRScanner = () => {
  const { currentUser, loading, hasRole } = useAuth();
  const navigate = useNavigate();
  const { makeApiCall, loading: apiLoading, error: apiError } = useApi();
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [stats, setStats] = useState({ total: 0, redeemed: 0, notRedeemed: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);

  const clearMessage = () => {
    setError("");
    setSuccess("");
    setScanResult(null);
  };

  // Debounced fetchStats to prevent excessive API calls
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const fetchStats = useCallback(async () => {
    try {
      const response = await makeApiCall("/rewards/stats", "GET");
      if (response.status !== "success") {
        throw new Error(response.message || "Failed to fetch stats");
      }
      console.log("Admin stats fetched:", response.data);
      setStats(response.data);
    } catch (err) {
      console.error("Failed to fetch stats:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        url: err.config?.url,
      });
      toast.error(err.message || "Failed to load statistics. Please try again.", {
        style: { fontSize: "14px", padding: "8px 16px" },
      });
    }
  }, [makeApiCall]);

  const debouncedFetchStats = useCallback(debounce(fetchStats, 1000), [fetchStats]);

  useEffect(() => {
    if (!loading && (!currentUser || !hasRole("content_manager", "moderator", "admin", "super_admin"))) {
      navigate("/login");
    } else if (!loading && hasRole("content_manager", "moderator", "admin", "super_admin")) {
      debouncedFetchStats();
    }
  }, [loading, currentUser, hasRole, navigate, debouncedFetchStats]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && currentUser && hasRole("content_manager", "moderator", "admin", "super_admin")) {
        debouncedFetchStats();
      }
    };

    const handleFocus = () => {
      if (currentUser && hasRole("content_manager", "moderator", "admin", "super_admin")) {
        debouncedFetchStats();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [currentUser, hasRole, debouncedFetchStats]);

  const handleRefreshStats = async () => {
    setRefreshing(true);
    try {
      await fetchStats();
      toast.success("Statistics refreshed successfully!", {
        style: { fontSize: "14px", padding: "8px 16px" },
      });
    } finally {
      setRefreshing(false);
    }
  };

  const startCamera = async () => {
    clearMessage();
    setIsScanning(true);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error(
        "Camera access is not supported on this device or browser. Please use a device with a camera and a compatible browser.",
        { style: { fontSize: "14px", padding: "8px 16px" } }
      );
      setIsScanning(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Prefer rear camera for scanning
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((err) => {
          console.error("Video play error:", err);
          toast.error("Failed to start video stream. Please try again.", {
            style: { fontSize: "14px", padding: "8px 16px" },
          });
          setIsScanning(false);
        });
      }
      scanForQRCode();
    } catch (err) {
      console.error("Camera access error:", err);
      let errorMessage = "Unable to access camera. Please allow camera permissions in your browser settings and try again.";
      if (err.name === "NotAllowedError") {
        errorMessage = "Camera access denied. Please enable camera permissions in your browser or device settings and try again.";
      } else if (err.name === "NotFoundError") {
        errorMessage = "No camera found on this device. Please use a device with a camera.";
      } else if (!window.location.protocol.includes("https") && window.location.hostname !== "localhost") {
        errorMessage = "Camera access requires a secure connection (HTTPS). Please access this page over HTTPS.";
      }
      toast.error(errorMessage, { style: { fontSize: "14px", padding: "8px 16px" } });
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsScanning(false);
  };

  const scanForQRCode = useCallback(() => {
    if (!isScanning || !videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext("2d");

    if (!video.videoWidth || !video.videoHeight) {
      animationFrameRef.current = requestAnimationFrame(scanForQRCode);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });

    if (code) {
      handleManualInput(code.data);
    } else {
      animationFrameRef.current = requestAnimationFrame(scanForQRCode);
    }
  }, [isScanning]);

  const handleManualInput = async (qrTokenOrUrl) => {
    clearMessage();
    try {
      let qrToken = qrTokenOrUrl;
      if (qrTokenOrUrl.includes("qrToken=")) {
        const url = new URL(qrTokenOrUrl);
        qrToken = url.searchParams.get("qrToken");
      }
      if (!qrToken) {
        throw new Error("Invalid QR code: No token found");
      }

      // CSRF-protected POST request
      const response = await makeApiCall("/rewards/redeem", "POST", { qrToken });
      if (response.status !== "success") {
        throw new Error(response.message || "Failed to redeem reward");
      }

      const result = response.data;
      setScanResult(result);
      setSuccess(`Reward redeemed successfully for User ID: ${result.userId}!`);
      toast.success(`Reward redeemed successfully for User ID: ${result.userId}!`, {
        style: { fontSize: "14px", padding: "8px 16px" },
      });
      await fetchStats();
      stopCamera();
    } catch (err) {
      console.error("Error redeeming reward:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        url: err.config?.url,
      });
      const errorMsg = err.message || "Failed to redeem reward. Please try again.";
      setError(errorMsg);
      setScanResult({ error: errorMsg });
      toast.error(errorMsg, { style: { fontSize: "14px", padding: "8px 16px" } });
    }
  };

  const simulateQRScan = async () => {
    clearMessage();
    try {
      const response = await makeApiCall("/rewards/1", "GET");
      if (response.status !== "success") {
        throw new Error(response.message || "Failed to fetch mock QR token");
      }
      const mockToken = response.data.qrToken;
      if (!mockToken) {
        throw new Error("No mock QR token received");
      }
      await handleManualInput(mockToken);
    } catch (err) {
      console.error("Error fetching mock QR token:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        url: err.config?.url,
      });
      const errorMsg = err.message || "Failed to fetch mock QR token. Please try again.";
      setError(errorMsg);
      toast.error(errorMsg, { style: { fontSize: "14px", padding: "8px 16px" } });
    }
  };

  if (loading || apiLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 px-4 sm:px-6 text-white text-center">
        <Toaster position="top-right" />
        <h1 className="text-2xl sm:text-4xl font-bold mb-4" aria-live="polite">
          Admin QR Scanner
        </h1>
        <p className="text-lg sm:text-xl text-gray-300" aria-live="polite">
          Loading...
        </p>
      </div>
    );
  }

  if (!currentUser || !hasRole("content_manager", "moderator", "admin", "super_admin")) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 px-4 sm:px-6 text-white text-center">
        <Toaster position="top-right" />
        <h1 className="text-2xl sm:text-4xl font-bold mb-4">Admin QR Scanner</h1>
        <p className="text-lg sm:text-xl text-red-200" aria-live="polite">
          Access Denied: You do not have permission to view this page.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 px-4 sm:px-6 text-white text-center">
      <Toaster position="top-right" />
      <div className="flex justify-between items-center max-w-4xl mx-auto mb-6 sm:mb-8">
        <div className="w-full flex justify-center">
          <h1 className="text-2xl sm:text-4xl font-bold text-center">
            Admin QR Scanner
          </h1>
        </div>
        <button
          onClick={handleRefreshStats}
          disabled={refreshing || apiLoading}
          className="p-2 sm:p-3 rounded-full bg-purple-600/30 hover:bg-purple-600/50 transition-colors duration-300 disabled:opacity-50"
          title="Refresh Statistics"
          aria-label="Refresh statistics"
        >
          <RefreshCw size={20} className={`text-purple-300 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="max-w-4xl mx-auto mb-6 sm:mb-8" aria-live="polite">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white/5 border border-white/20 rounded-2xl p-4 sm:p-6 shadow-xl">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <Gift className="text-blue-400" size={24} />
              <div>
                <p className="text-gray-300 text-sm">Total Rewards</p>
                <p className="text-xl sm:text-3xl font-bold text-white">{stats.total || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/5 border border-white/20 rounded-2xl p-4 sm:p-6 shadow-xl">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <CheckCircle className="text-green-400" size={24} />
              <div>
                <p className="text-gray-300 text-sm">Redeemed</p>
                <p className="text-xl sm:text-3xl font-bold text-white">{stats.redeemed || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/5 border border-white/20 rounded-2xl p-4 sm:p-6 shadow-xl">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <Users className="text-orange-400" size={24} />
              <div>
                <p className="text-gray-300 text-sm">Pending</p>
                <p className="text-xl sm:text-3xl font-bold text-white">{stats.notRedeemed || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {stats.total > 0 && (
          <div className="mt-4 sm:mt-6 bg-white/5 border border-white/20 rounded-xl p-4">
            <div className="text-center mb-2 sm:mb-3">
              <span className="text-base sm:text-lg font-semibold text-white">
                Redemption Rate: {Math.round((stats.redeemed / stats.total) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 sm:h-3">
              <div
                className="bg-gradient-to-r from-green-500 to-blue-500 h-2 sm:h-3 rounded-full transition-all duration-500"
                style={{ width: `${(stats.redeemed / stats.total) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto bg-white/5 border border-white/20 rounded-2xl p-4 sm:p-8 shadow-xl">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 flex items-center justify-center gap-2">
          <Scan className="text-blue-400" size={20} />
          QR Code Scanner
        </h2>

        {(error || apiError) && (
          <div className="bg-red-600/20 border border-red-500/50 text-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} />
              <span className="text-sm sm:text-base">{error || apiError}</span>
            </div>
            <button
              onClick={clearMessage}
              className="text-red-200 hover:text-red-100"
              aria-label="Dismiss message"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {success && (
          <div className="bg-green-600/20 border border-green-500/50 text-green-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} />
              <span className="text-sm sm:text-base">{success}</span>
            </div>
            <button
              onClick={clearMessage}
              className="text-green-200 hover:text-green-100"
              aria-label="Dismiss message"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {!isScanning ? (
          <div className="text-center">
            <button
              onClick={startCamera}
              disabled={apiLoading}
              className={`bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-full transition-all duration-300 font-semibold flex items-center justify-center gap-2 mx-auto mb-4 sm:mb-6 text-sm sm:text-base ${
                apiLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              aria-label="Start camera scanner"
            >
              <Camera size={16} />
              Start Camera Scanner
            </button>

            <div className="pt-4 sm:pt-6 border-t border-white/20">
              <p className="text-gray-300 text-sm mb-4">For testing purposes:</p>
              <button
                onClick={simulateQRScan}
                disabled={apiLoading}
                className={`bg-gray-600 hover:bg-gray-700 text-white px-4 sm:px-6 py-2 rounded-full transition-all duration-300 text-sm sm:text-base ${
                  apiLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
                aria-label="Simulate QR code scan"
              >
                Simulate QR Code Scan
              </button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="relative rounded-lg overflow-hidden mb-4">
              <video ref={videoRef} className="w-full rounded-lg" autoPlay playsInline muted />
              <canvas ref={canvasRef} className="hidden" />

              <div className="absolute inset-0 border-2 border-blue-400 rounded-lg pointer-events-none">
                <div className="absolute top-4 left-4 w-6 sm:w-8 h-6 sm:h-8 border-l-4 border-t-4 border-blue-400"></div>
                <div className="absolute top-4 right-4 w-6 sm:w-8 h-6 sm:h-8 border-r-4 border-t-4 border-blue-400"></div>
                <div className="absolute bottom-4 left-4 w-6 sm:w-8 h-6 sm:h-8 border-l-4 border-b-4 border-blue-400"></div>
                <div className="absolute bottom-4 right-4 w-6 sm:w-8 h-6 sm:h-8 border-r-4 border-b-4 border-blue-400"></div>
                <div className="absolute inset-x-0 top-1/2 h-0.5 bg-blue-400 opacity-75"></div>
              </div>

              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  Scanning...
                </div>
              </div>
            </div>

            <button
              onClick={stopCamera}
              className="bg-red-600 hover:bg-red-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full transition-all duration-300 font-semibold text-sm sm:text-base"
              aria-label="Stop scanner"
            >
              Stop Scanner
            </button>
          </div>
        )}

        {scanResult && (
          <div className="mt-4 sm:mt-6 p-4 sm:p-6 bg-white/10 rounded-lg border border-white/20" aria-live="polite">
            <h3 className="text-base sm:text-lg font-semibold mb-4 text-center">Scan Result</h3>
            {scanResult.error ? (
              <div className="text-center">
                <XCircle className="mx-auto mb-3 text-red-400" size={24} />
                <p className="text-red-200 text-sm sm:text-base">{scanResult.error}</p>
              </div>
            ) : (
              <div className="text-center space-y-2">
                <CheckCircle className="mx-auto mb-4 text-green-400" size={24} />
                <p className="text-white text-sm sm:text-base">
                  <span className="text-gray-300">User ID:</span>{" "}
                  <span className="font-semibold">{scanResult.userId}</span>
                </p>
                <p className="text-white text-sm sm:text-base">
                  <span className="text-gray-300">Reward ID:</span>{" "}
                  <span className="font-semibold">{scanResult.rewardId}</span>
                </p>
                <p className="text-white text-sm sm:text-base">
                  <span className="text-gray-300">Redeemed At:</span>{" "}
                  <span className="font-semibold">
                    {new Date(scanResult.redeemedAt).toLocaleString()}
                  </span>
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 sm:mt-8">
        <p className="text-gray-300 text-sm sm:text-base">
          Back to{" "}
          <button
            onClick={() => navigate("/admin")}
            className="text-blue-400 hover:text-blue-300 font-semibold underline transition-colors"
            aria-label="Navigate to admin dashboard"
          >
            Admin Dashboard
          </button>
        </p>
      </div>
    </div>
  );
};

export default AdminQRScanner;