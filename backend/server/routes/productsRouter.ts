// routes/productsRoutes.ts
import { Router } from "express";
import {productsController} from "../controllers/productsController.js";
import {productImagesController} from "../controllers/imageController.js";
import {uploadToCloudinary} from "../config/multerCloudinary.js";
// import {uploadToCloudinary} from "./../../config/multerCloudinary"

const router = Router();

router.get("/", productsController.getProducts);
router.get("/:id", productsController.getProductById);
router.post("/:productId/images", uploadToCloudinary.single("file"), productImagesController.uploadImage);
router.get("/slug/:slug", productsController.getProductBySlug);

router.post(
    "/",
    uploadToCloudinary.single("image"),
    productsController.createProduct
);
router.put("/:id", productsController.updateProduct);
router.delete("/:id", productsController.deleteProduct);

export default router;
