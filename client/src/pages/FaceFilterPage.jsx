import React, { useEffect } from "react";
import axios from "axios";
import ARViewer from "../components/ARViewer";

const FaceFilterPage = () => {
  useEffect(() => {
    const handleMessage = async (event) => {
      if (event.data?.type === "imageCapture") {
        console.log("Image captured:", event.data.imageData);

        try {
          await axios.post("http://localhost:5000/api/images/upload", {
            imageData: event.data.imageData,
          });
          console.log("Image uploaded successfully.");
        } catch (error) {
          console.error("Error uploading image:", error);
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <ARViewer />
    </div>
  );
};

export default FaceFilterPage;
