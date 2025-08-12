import React, { useState, useEffect } from "react";
import { useAuth } from "../components/AuthProvider";
import { useNavigate } from "react-router-dom";

const ScanPage = () => {
  const [scannedData, setScannedData] = useState(null);
  const { currentUser, hasRole, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!loading && !currentUser) {
      navigate('/login');
    }
  }, [currentUser, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if user is not authenticated (will redirect)
  if (!currentUser) {
    return null;
  }

  return (
    <div id="8thwall-scan-container" style={{ position: "relative", width: "100%", height: "100vh" }}>
      {/* Optional: Add a header with user info */}
      <div style={{ 
        position: "absolute", 
        top: "10px", 
        left: "10px", 
        zIndex: 10, 
        background: "rgba(0,0,0,0.7)", 
        color: "white", 
        padding: "8px 12px", 
        borderRadius: "6px",
        fontSize: "14px"
      }}>
        Welcome, {currentUser.username}!
      </div>
      
      <div id="8thwall-iframe-container" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
        <iframe
          src="https://kh24.8thwall.app/scp-project-2-beta-2"
          style={{ width: "100%", height: "100%", border: "none" }}
          allow="camera; fullscreen"
          title="8th Wall AR Scanner"
        />
      </div>
    </div>
  );
};

export default ScanPage;