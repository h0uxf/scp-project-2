import React, { useState, useEffect, useRef } from "react";
import jsQR from "jsqr";
import { Camera, CheckCircle, XCircle, Users, Gift, AlertCircle, Scan, RefreshCw } from "lucide-react";
import { useAuth } from "../components/AuthProvider";
import { useNavigate } from "react-router-dom";

const AdminQRScanner = () => {
  const { currentUser, loading, hasRole } = useAuth();
  const navigate = useNavigate();

  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [stats, setStats] = useState({ total: 0, redeemed: 0, notRedeemed: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (!loading && (!currentUser || !hasRole(3, 4, 5))) {
      navigate("/login");
    } else if (!loading && hasRole(3, 4, 5)) {
      fetchStats();
    }
  }, [loading, currentUser, navigate, hasRole]);

  // Auto-refresh stats when component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && currentUser && hasRole(3, 4, 5)) {
        fetchStats();
      }
    };

    const handleFocus = () => {
      if (currentUser && hasRole(3, 4, 5)) {
        fetchStats();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [currentUser, hasRole]);

  const fetchStats = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/rewards/stats", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch statistics");
      }

      const data = await response.json();
      console.log("Admin stats fetched:", data);
      setStats(data.data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
      setError("Failed to load statistics");
    }
  };

  const handleRefreshStats = async () => {
    setRefreshing(true);
    try {
      await fetchStats();
    } finally {
      setRefreshing(false);
    }
  };

  const startCamera = async () => {
    setError("");
    setSuccess("");
    setScanResult(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsScanning(true);
      scanForQRCode();
    } catch (err) {
      setError("Camera access denied or not available");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const scanForQRCode = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !isScanning) return;

    const context = canvas.getContext("2d");
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
      requestAnimationFrame(scanForQRCode);
    }
  };

  const handleManualInput = async (qrTokenOrUrl) => {
    setError("");
    setSuccess("");

    try {
      // Extract qrToken from URL if it's a full URL
      let qrToken = qrTokenOrUrl;
      if (qrTokenOrUrl.includes('qrToken=')) {
        const url = new URL(qrTokenOrUrl);
        qrToken = url.searchParams.get('qrToken');
      }

      const response = await fetch("http://localhost:5000/api/rewards/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ qrToken }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to redeem reward");
      }

      const data = await response.json();
      const result = data.data;

      setScanResult(result);
      setSuccess(`Reward redeemed successfully for User ID: ${result.userId}!`);
      
      // Refresh stats after successful redemption
      fetchStats();
      stopCamera();
    } catch (err) {
      const errorMsg = err.message || "Failed to redeem reward";
      setError(errorMsg);
      setScanResult({ error: errorMsg });
    }
  };

  const simulateQRScan = () => {
    const mockToken = "0d19b00f-286d-4b25-b2b3-8ae80f239762"; // Use the provided mock QR token
    handleManualInput(mockToken);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-20 px-6 text-white text-center">
        <h1 className="text-4xl font-bold mb-4">Admin QR Scanner</h1>
        <p className="text-xl text-gray-300">Loading...</p>
      </div>
    );
  }

  if (!currentUser || !hasRole(3, 4, 5)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-20 px-6 text-white text-center">
        <h1 className="text-4xl font-bold mb-4">Admin QR Scanner</h1>
        <p className="text-xl text-red-300">Access Denied: You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-20 px-6 text-white text-center">
      <div className="flex justify-between items-center max-w-4xl mx-auto mb-8">
        <div className="w-full flex justify-center">
            <h1 className="text-4xl font-bold text-center">Admin QR Scanner</h1>
        </div>
        <button
          onClick={handleRefreshStats}
          disabled={refreshing}
          className="p-3 rounded-full bg-purple-600/30 hover:bg-purple-600/50 transition-colors duration-300 disabled:opacity-50"
          title="Refresh Statistics"
        >
          <RefreshCw size={24} className={`text-purple-300 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/5 border border-white/20 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Gift className="text-blue-400" size={32} />
              <div>
                <p className="text-gray-300 text-sm">Total Rewards</p>
                <p className="text-3xl font-bold text-white">{stats.total || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/5 border border-white/20 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-center gap-3 mb-3">
              <CheckCircle className="text-green-400" size={32} />
              <div>
                <p className="text-gray-300 text-sm">Redeemed</p>
                <p className="text-3xl font-bold text-white">{stats.redeemed || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/5 border border-white/20 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Users className="text-orange-400" size={32} />
              <div>
                <p className="text-gray-300 text-sm">Pending</p>
                <p className="text-3xl font-bold text-white">{stats.notRedeemed || 0}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        {stats.total > 0 && (
          <div className="mt-6 bg-white/5 border border-white/20 rounded-xl p-4">
            <div className="text-center mb-3">
              <span className="text-lg font-semibold text-white">
                Redemption Rate: {Math.round((stats.redeemed / stats.total) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${(stats.redeemed / stats.total) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* QR Scanner */}
      <div className="max-w-2xl mx-auto bg-white/5 border border-white/20 rounded-2xl p-8 shadow-xl">
        <h2 className="text-2xl font-semibold mb-6 flex items-center justify-center gap-2">
          <Scan className="text-blue-400" />
          QR Code Scanner
        </h2>

        {error && (
          <div className="bg-red-600/20 border border-red-500/50 text-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-600/20 border border-green-500/50 text-green-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <CheckCircle size={20} />
            <span>{success}</span>
          </div>
        )}

        {!isScanning ? (
          <div className="text-center">
            <button
              onClick={startCamera}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full transition-all duration-300 font-semibold flex items-center justify-center gap-3 mx-auto mb-6"
            >
              <Camera size={20} />
              Start Camera Scanner
            </button>

            {/* Manual / Test */}
            <div className="pt-6 border-t border-white/20">
              <p className="text-gray-300 text-sm mb-4">For testing purposes:</p>
              <button
                onClick={simulateQRScan}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-full transition-all duration-300"
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

              {/* Overlay */}
              <div className="absolute inset-0 border-2 border-blue-400 rounded-lg pointer-events-none">
                <div className="absolute top-4 left-4 w-8 h-8 border-l-4 border-t-4 border-blue-400"></div>
                <div className="absolute top-4 right-4 w-8 h-8 border-r-4 border-t-4 border-blue-400"></div>
                <div className="absolute bottom-4 left-4 w-8 h-8 border-l-4 border-b-4 border-blue-400"></div>
                <div className="absolute bottom-4 right-4 w-8 h-8 border-r-4 border-b-4 border-blue-400"></div>
                <div className="absolute inset-x-0 top-1/2 h-0.5 bg-blue-400 opacity-75"></div>
              </div>

              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-full text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  Scanning...
                </div>
              </div>
            </div>

            <button
              onClick={stopCamera}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full transition-all duration-300 font-semibold"
            >
              Stop Scanner
            </button>
          </div>
        )}

        {scanResult && (
          <div className="mt-6 p-6 bg-white/10 rounded-lg border border-white/20">
            <h3 className="text-lg font-semibold mb-4 text-center">Scan Result</h3>
            {scanResult.error ? (
              <div className="text-center">
                <XCircle className="mx-auto mb-3 text-red-400" size={32} />
                <p className="text-red-300">{scanResult.error}</p>
              </div>
            ) : (
              <div className="text-center space-y-2">
                <CheckCircle className="mx-auto mb-4 text-green-400" size={32} />
                <p className="text-white">
                  <span className="text-gray-300">User ID:</span>{" "}
                  <span className="font-semibold">{scanResult.userId}</span>
                </p>
                <p className="text-white">
                  <span className="text-gray-300">Reward ID:</span>{" "}
                  <span className="font-semibold">{scanResult.rewardId}</span>
                </p>
                <p className="text-white">
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

      <div className="mt-8">
        <p className="text-gray-300">
          Back to{" "}
          <button
            onClick={() => navigate("/admin")}
            className="text-blue-400 hover:text-blue-300 font-semibold underline transition-colors"
          >
            Admin Dashboard
          </button>
        </p>
      </div>
    </div>
  );
};

export default AdminQRScanner;