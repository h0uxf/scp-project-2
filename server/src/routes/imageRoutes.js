const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Configure storage for uploaded images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads/images");
    // Ensure the upload directory exists
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Save file with unique timestamp + original name
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `img-${uniqueSuffix}${ext}`);
  },
});

// Only accept image files (png, jpeg, jpg)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file format. Only PNG, JPEG, JPG allowed."), false);
  }
};

const upload = multer({ storage, fileFilter });

// POST /api/images/upload
router.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ status: "error", message: "No image file uploaded." });
  }
  
  // Return the path or URL where the image is stored
  const imageUrl = `/uploads/images/${req.file.filename}`;

  res.status(201).json({
    status: "success",
    message: "Image uploaded successfully",
    data: { imageUrl },
  });
});

module.exports = router;
