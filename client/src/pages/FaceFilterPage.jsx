import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import ARViewer from "../components/ARViewer";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const FaceFilterPage = () => {
  const uploadingRef = useRef(false); // track upload status

  const uploadBase64Image = async (base64DataUrl) => {
    if (uploadingRef.current) {
      console.log("Upload already in progress, ignoring duplicate.");
      return;
    }
    uploadingRef.current = true;

    try {
      const res = await fetch(base64DataUrl);
      const blob = await res.blob();

      const formData = new FormData();
      formData.append("image", blob, "photo.jpg");

      const uploadRes = await axios.post(`${API_BASE_URL}/api/images/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      uploadingRef.current = false;
    }
  };

  useEffect(() => {
    const handleMessage = async (event) => {
      if (event.data?.type === "imageCapture") {
        console.log("Image captured:", event.data.imageData);
        await uploadBase64Image(event.data.imageData);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative" }}>
      <ARViewer />
    </div>
  );
};

export default FaceFilterPage;
