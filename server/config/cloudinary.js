import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";

// CRITICAL: Load env variables right here (safe even if already loaded)
import dotenv from "dotenv";
dotenv.config();

// Now it's safe to configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Optional: Debug (remove in production)
// console.log("Cloudinary Config:", {
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY?.slice(0, 4) + "...",
// });

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "expense-receipts",
    allowed_formats: ["jpg", "jpeg", "png", "pdf", "webp"],
    public_id: (req, file) => `receipt-${Date.now()}-${Math.round(Math.random() * 1E9)}`,
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf", "image/webp"];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPG, PNG, WEBP, and PDF allowed."), false);
    }
  },
});


