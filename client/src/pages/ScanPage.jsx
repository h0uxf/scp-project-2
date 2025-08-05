import React, { useState, useEffect } from "react";

const ScanPage = () => {
  const [scannedData, setScannedData] = useState(null);

//   useEffect(() => {
//     // embed 8thwall web app page in iframe
//     const iframe = document.createElement("iframe");
//     iframe.src = "https://kh24.8thwall.app/scan";
//     iframe.style.width = "100%";
//     iframe.style.height = "100vh";
//     iframe.style.border = "none";
//     document.body.appendChild(iframe);

//   }, []);

  return (
    <div id="8thwall-scan-container" style={{ position: "relative", width: "100%", height: "100vh" }}>
      <h1>Scan Page</h1>
      <div id="8thwall-iframe-container" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
        <iframe
          src="https://kh24.8thwall.app/scp-project-2-beta-2"
          style={{ width: "100%", height: "100%", border: "none" }}
        />
      </div>
    </div>
  );
};

export default ScanPage;
