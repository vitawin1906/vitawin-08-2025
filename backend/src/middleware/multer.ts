import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { cloudinary } from "../../config/cloudinary.js";

const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
        folder: "products",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        transformation: [{ width: 800, crop: "scale" }],
        public_id: `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, "")}`, // Уникальный `public_id`
    }),
});

export const upload = multer({ storage });
