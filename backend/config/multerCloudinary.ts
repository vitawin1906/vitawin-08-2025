import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

export const cloudinaryStorage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
        folder: "products", // или "uploads" или что тебе нужно
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        transformation: [{ quality: "auto" }, { fetch_format: "auto" }]
    })
});

export const uploadToCloudinary = multer({ storage: cloudinaryStorage });
