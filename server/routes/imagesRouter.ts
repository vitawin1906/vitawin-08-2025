import { Router } from "express";
import { uploadToCloudinary } from "../config/multerCloudinary";
import { uploadedImagesController } from "../controllers/uploadController.ts";

const router = Router();
router.post("/upload", uploadToCloudinary.single("file"), uploadedImagesController.uploadImage);
router.get("/", uploadedImagesController.getAllImages);
router.delete("/:id", uploadedImagesController.deleteImage);

export default router;
