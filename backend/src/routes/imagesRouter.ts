import { Router } from "express";
import {uploadedImagesController} from "../controllers/uploadController.js";
import {uploadToCloudinary} from "../../config/multerCloudinary.js";


const router = Router();
router.post("/upload", uploadToCloudinary.single("file"), uploadedImagesController.uploadImage);
router.get("/", uploadedImagesController.getAllImages);
router.delete("/:id", uploadedImagesController.deleteImage);

export default router;
