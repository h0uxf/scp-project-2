import React, { useState, useEffect, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  Camera,
  CheckCircle,
  XCircle,
  Users,
  Gift,
  AlertCircle,
  Scan,
  RefreshCw,
  X,
  Upload,
  Shield,
} from "lucide-react";
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
  const [cameraPermission, setCameraPermission] = useState(null);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [lastScannedToken, setLastScannedToken] = useState(null);
  const html5QrCodeRef = useRef(null);
  const fileInputRef = useRef(null);

  const clearMessage = () => {
    setError("");
    setSuccess("");
    setScanResult(null);
  };

  // Check camera permissions
  const checkCameraPermission = async () => {
    try {
      const isSecureContext =
        window.isSecureContext || location.hostname === "localhost";
      if (!isSecureContext) {
        setCameraPermission("denied");
        setError(
          "Camera access requires HTTPS connection. Please access this page over HTTPS."
        );
        return false;
      }

      if (navigator.permissions) {
        const permission = await navigator.permissions.query({
          name: "camera",
        });
        setCameraPermission(permission.state);
        return permission.state === "granted";
      }

      const devices = await Html5Qrcode.getCameras();
      console.log("Available cameras:", devices); // Debug: Log available cameras
      setAvailableCameras(devices);
      if (devices.length > 0) {
        // Prefer back camera (environment-facing) if available
        const backCamera = devices.find(
          (device) =>
            device.label.toLowerCase().includes("back") ||
            device.label.toLowerCase().includes("rear")
        );
        setSelectedCamera(backCamera ? backCamera.id : devices[0].id);
        setCameraPermission("granted");
        return true;
      } else {
        setCameraPermission("denied");
        return false;
      }
    } catch (err) {
      console.error("Camera permission check failed:", err);
      setCameraPermission("denied");
      setError(
        "Camera access denied or not available. Please check your browser settings."
      );
      return false;
    }
  };

  const requestCameraPermission = async () => {
    try {
      clearMessage();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      stream.getTracks().forEach((track) => track.stop());
      setCameraPermission("granted");
      const devices = await Html5Qrcode.getCameras();
      console.log("Available cameras after permission:", devices); // Debug: Log cameras
      setAvailableCameras(devices);
      const backCamera = devices.find(
        (device) =>
          device.label.toLowerCase().includes("back") ||
          device.label.toLowerCase().includes("rear")
      );
      setSelectedCamera(backCamera ? backCamera.id : devices[0].id);
      toast.success("Camera access granted!", {
        style: { fontSize: "14px", padding: "8px 16px" },
      });
      return true;
    } catch (err) {
      console.error("Camera permission request failed:", err);
      setCameraPermission("denied");
      let errorMessage = "Camera access denied. ";
      if (err.name === "NotAllowedError") {
        errorMessage +=
          "Please allow camera access in your browser settings and try again.";
      } else if (err.name === "NotFoundError") {
        errorMessage += "No camera found on this device.";
      } else if (err.name === "NotSupportedError") {
        errorMessage += "Camera not supported on this device.";
      } else {
        errorMessage += "Please check your camera settings and try again.";
      }
      setError(errorMessage);
      toast.error(errorMessage, {
        style: { fontSize: "14px", padding: "8px 16px" },
      });
      return false;
    }
  };

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
      setStats(response.data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
      toast.error(
        err.message || "Failed to load statistics. Please try again.",
        {
          style: { fontSize: "14px", padding: "8px 16px" },
        }
      );
    }
  }, [makeApiCall]);

  const debouncedFetchStats = useCallback(debounce(fetchStats, 1000), [
    fetchStats,
  ]);

  useEffect(() => {
    if (
      !loading &&
      (!currentUser ||
        !hasRole("content_manager", "moderator", "admin", "super_admin"))
    ) {
      navigate("/login");
    } else if (
      !loading &&
      hasRole("content_manager", "moderator", "admin", "super_admin")
    ) {
      debouncedFetchStats();
      checkCameraPermission();
    }
  }, [loading, currentUser, hasRole, navigate, debouncedFetchStats]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        !document.hidden &&
        currentUser &&
        hasRole("content_manager", "moderator", "admin", "super_admin")
      ) {
        debouncedFetchStats();
      }
    };

    const handleFocus = () => {
      if (
        currentUser &&
        hasRole("content_manager", "moderator", "admin", "super_admin")
      ) {
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
    if (cameraPermission !== "granted") {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        return;
      }
    }
    setIsScanning(true);
  };

  const stopCamera = async () => {
    try {
      if (html5QrCodeRef.current) {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
        html5QrCodeRef.current = null;
      }
    } catch (err) {
      console.error("Failed to stop camera:", err);
    }
    setIsScanning(false);
  };

  useEffect(() => {
    if (isScanning) {
      const initializeScanner = async () => {
        const readerElement = document.getElementById("reader");
        if (!readerElement) {
          setIsScanning(false);
          setError("Failed to start scanner: Reader element not found in DOM.");
          toast.error("Failed to start scanner: Reader element not found.", {
            style: { fontSize: "14px", padding: "8px 16px" },
          });
          return;
        }

        try {
          html5QrCodeRef.current = new Html5Qrcode("reader");
          const cameraId =
            selectedCamera ||
            (availableCameras.length > 0 ? availableCameras[0].id : undefined);
          const config = {
            fps: 15, // Increased FPS for faster scanning
            qrbox: { width: 300, height: 300 }, // Larger scan area
            aspectRatio: 1.0,
            disableFlip: false,
            videoConstraints: {
              width: { ideal: 1280 }, // Higher resolution
              height: { ideal: 720 },
              facingMode: "environment",
            },
          };

          console.log(
            "Starting scanner with camera:",
            cameraId || "environment"
          ); // Debug: Log camera used

          await html5QrCodeRef.current.start(
            cameraId || { facingMode: "environment" },
            config,
            async (decodedText, decodedResult) => {
              console.log("QR Code detected:", decodedText, decodedResult);
              if (decodedText === lastScannedToken) {
                toast.error("This QR code was already scanned.", {
                  style: { fontSize: "14px", padding: "8px 16px" },
                });
                return;
              }
              setLastScannedToken(decodedText);
              await handleManualInput(decodedText);
              stopCamera();
            },
            (errorMessage) => {
              // Ignore all common non-critical errors to prevent spamming and crashing
              if (
                !errorMessage ||
                errorMessage.toLowerCase().includes("no qr code found") ||
                errorMessage.toLowerCase().includes("multi format") ||
                errorMessage.toLowerCase().includes("reader") ||
                errorMessage.toLowerCase().includes("detect")
              ) {
                return;
              }
              console.error("QR scan error:", errorMessage);
              setError(`Scan error: ${errorMessage}`);
              toast.error(`Scan error: ${errorMessage}`, {
                style: { fontSize: "14px", padding: "8px 16px" },
              });
            }
          );
          toast.success("Scanner started successfully!", {
            style: { fontSize: "14px", padding: "8px 16px" },
          });
        } catch (err) {
          console.error("Failed to start camera:", err);
          setIsScanning(false);
          let errorMessage = "Failed to start camera. ";
          if (err.name === "NotAllowedError") {
            errorMessage += "Please allow camera access and try again.";
            setCameraPermission("denied");
          } else if (err.name === "NotFoundError") {
            errorMessage += "No camera found on this device.";
          } else {
            errorMessage += err.message || "Please try again.";
          }
          setError(errorMessage);
          toast.error(errorMessage, {
            style: { fontSize: "14px", padding: "8px 16px" },
          });
        }
      };

      initializeScanner();
    }

    return () => {
      if (isScanning && html5QrCodeRef.current) {
        html5QrCodeRef.current
          .stop()
          .then(() => {
            html5QrCodeRef.current.clear();
            html5QrCodeRef.current = null;
          })
          .catch((err) => console.error("Failed to cleanup scanner:", err));
      }
    };
  }, [isScanning, selectedCamera, availableCameras]);

  const handleImageUpload = async (event) => {
    clearMessage();
    const file = event.target.files[0];
    if (!file) {
      toast.error("No file selected. Please choose an image.", {
        style: { fontSize: "14px", padding: "8px 16px" },
      });
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file (PNG, JPEG, etc.).", {
        style: { fontSize: "14px", padding: "8px 16px" },
      });
      return;
    }

    try {
      // Initialize Html5Qrcode instance if not already initialized
      const html5QrCode = new Html5Qrcode("reader");
      try {
        // Use scanFileV2 for better results (returns decoded text and format)
        const result = await html5QrCode.scanFileV2(file, true);
        console.log("QR Code from image:", result);
        if (result.decodedText === lastScannedToken) {
          toast.error("This QR code was already scanned.", {
            style: { fontSize: "14px", padding: "8px 16px" },
          });
          return;
        }
        setLastScannedToken(result.decodedText);
        await handleManualInput(result.decodedText);
      } catch (err) {
        console.error("Error scanning image:", err);
        toast.error(
          "No QR code found in the image or scanning failed. Please try another image.",
          {
            style: { fontSize: "14px", padding: "8px 16px" },
          }
        );
      } finally {
        // Clean up the Html5Qrcode instance
        html5QrCode.clear();
      }
    } catch (err) {
      console.error("Error processing image:", err);
      toast.error("Failed to process image. Please try again.", {
        style: { fontSize: "14px", padding: "8px 16px" },
      });
    }

    event.target.value = null;
  };

  const handleManualInput = async (qrTokenOrUrl) => {
    clearMessage();
    try {
      let qrToken = qrTokenOrUrl;
      console.log("Processing QR token:", qrToken);
      if (qrTokenOrUrl.includes("qrToken=")) {
        const url = new URL(qrTokenOrUrl);
        qrToken = url.searchParams.get("qrToken");
        console.log("Extracted qrToken from URL:", qrToken);
      }
      if (!qrToken) {
        throw new Error("Invalid QR code: No token found");
      }

      if (qrToken === lastScannedToken) {
        setError("This QR code was already scanned.");
        toast.error("This QR code was already scanned.", {
          style: { fontSize: "14px", padding: "8px 16px" },
        });
        return;
      }

      const response = await makeApiCall("/rewards/redeem", "POST", {
        qrToken,
      });
      if (response.status !== "success") {
        throw new Error(response.message || "Failed to redeem reward");
      }

      const result = response.data;
      setScanResult(result);
      setSuccess(`Reward redeemed successfully for User ID: ${result.userId}!`);
      setLastScannedToken(qrToken);
      toast.success(
        `Reward redeemed successfully for User ID: ${result.userId}!`,
        {
          style: { fontSize: "14px", padding: "8px 16px" },
        }
      );
      await fetchStats();
    } catch (err) {
      console.error("Error redeeming reward:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        url: err.config?.url,
      });
      const errorMsg =
        err.message || "Failed to redeem reward. Please try again.";
      setError(errorMsg);
      setScanResult({ error: errorMsg });
      toast.error(errorMsg, {
        style: { fontSize: "14px", padding: "8px 16px" },
      });
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

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

  if (
    !currentUser ||
    !hasRole("content_manager", "moderator", "admin", "super_admin")
  ) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 px-4 sm:px-6 text-white text-center">
        <Toaster position="top-right" />
        <h1 className="text-2xl sm:text-4xl font-bold mb-4">
          Admin QR Scanner
        </h1>
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
          <RefreshCw
            size={20}
            className={`text-purple-300 ${refreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {cameraPermission === "denied" && (
        <div className="max-w-2xl mx-auto mb-6 bg-red-600/20 border border-red-500/50 text-red-200 rounded-lg p-4 flex items-center gap-3">
          <Shield className="text-red-400 flex-shrink-0" size={20} />
          <div className="text-left">
            <p className="font-semibold mb-1">Camera Access Required</p>
            <p className="text-sm">
              This scanner needs camera access to work. Please enable camera
              permissions in your browser settings.
            </p>
            <button
              onClick={requestCameraPermission}
              className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors"
            >
              Request Permission
            </button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto mb-6 sm:mb-8" aria-live="polite">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white/5 border border-white/20 rounded-2xl p-4 sm:p-6 shadow-xl">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <Gift className="text-blue-400" size={24} />
              <div>
                <p className="text-gray-300 text-sm">Total Rewards</p>
                <p className="text-xl sm:text-3xl font-bold text-white">
                  {stats.total || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white/5 border border-white/20 rounded-2xl p-4 sm:p-6 shadow-xl">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <CheckCircle className="text-green-400" size={24} />
              <div>
                <p className="text-gray-300 text-sm">Redeemed</p>
                <p className="text-xl sm:text-3xl font-bold text-white">
                  {stats.redeemed || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white/5 border border-white/20 rounded-2xl p-4 sm:p-6 shadow-xl">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <Users className="text-orange-400" size={24} />
              <div>
                <p className="text-gray-300 text-sm">Pending</p>
                <p className="text-xl sm:text-3xl font-bold text-white">
                  {stats.notRedeemed || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {stats.total > 0 && (
          <div className="mt-4 sm:mt-6 bg-white/5 border border-white/20 rounded-xl p-4">
            <div className="text-center mb-2 sm:mb-3">
              <span className="text-base sm:text-lg font-semibold text-white">
                Redemption Rate:{" "}
                {Math.round((stats.redeemed / stats.total) * 100)}%
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

        {availableCameras.length > 1 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Camera:
            </label>
            <select
              value={selectedCamera || ""}
              onChange={(e) => setSelectedCamera(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableCameras.map((camera) => (
                <option
                  key={camera.id}
                  value={camera.id}
                  className="bg-gray-800"
                >
                  {camera.label || `Camera ${camera.id}`}
                </option>
              ))}
            </select>
          </div>
        )}

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

        <div className="relative">
          <div
            id="reader"
            className={`w-full max-w-md mx-auto rounded-lg overflow-hidden mb-4 ${
              !isScanning ? "hidden" : ""
            }`}
            style={{ minHeight: "300px" }} // Increased minHeight for better visibility
          ></div>
          {isScanning && (
            <div className="text-sm text-gray-300 mb-4">
              <p>
                Scanning... Hold the QR code steady and ensure good lighting.
              </p>
              <p>
                Position the QR code within the camera frame, about 6-12 inches
                away.
              </p>
            </div>
          )}
          {!isScanning ? (
            <div className="text-center">
              <button
                onClick={startCamera}
                disabled={apiLoading || cameraPermission === "denied"}
                className={`bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-full transition-all duration-300 font-semibold flex items-center justify-center gap-2 mx-auto mb-4 sm:mb-6 text-sm sm:text-base ${
                  apiLoading || cameraPermission === "denied"
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                aria-label="Start camera scanner"
              >
                <Camera size={16} />
                Start Camera Scanner
              </button>

              <div className="pt-4 sm:pt-6 border-t border-white/20">
                <p className="text-gray-300 text-sm mb-4">
                  Alternative options:
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => fileInputRef.current.click()}
                    disabled={apiLoading}
                    className={`bg-purple-600 hover:bg-purple-700 text-white px-4 sm:px-6 py-2 rounded-full transition-all duration-300 text-sm sm:text-base ${
                      apiLoading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    aria-label="Upload QR code image"
                  >
                    <Upload size={16} className="inline-block mr-2" />
                    Upload QR Code Image
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                    aria-label="Upload QR code image file"
                  />
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={stopCamera}
              className="bg-red-600 hover:bg-red-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full transition-all duration-300 font-semibold text-sm sm:text-base"
              aria-label="Stop scanner"
            >
              Stop Scanner
            </button>
          )}
        </div>

        {scanResult && (
          <div
            className="mt-4 sm:mt-6 p-4 sm:p-6 bg-white/10 rounded-lg border border-white/20"
            aria-live="polite"
          >
            <h3 className="text-base sm:text-lg font-semibold mb-4 text-center">
              Scan Result
            </h3>
            {scanResult.error ? (
              <div className="text-center">
                <XCircle className="mx-auto mb-3 text-red-400" size={24} />
                <p className="text-red-200 text-sm sm:text-base">
                  {scanResult.error}
                </p>
              </div>
            ) : (
              <div className="text-center space-y-2">
                <CheckCircle
                  className="mx-auto mb-4 text-green-400"
                  size={24}
                />
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
