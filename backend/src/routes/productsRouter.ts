// routes/productsRouter.ts
import { Router } from "express";
import { productsController } from "../controllers/productsController.js";
import { productImagesController } from "../controllers/imageController.js";
import { upload } from "../middleware/multer.js";

const productsRouter = Router();

// ------- ТОВАРЫ -------
productsRouter.get("/", productsController.getProducts);
productsRouter.get("/:id", productsController.getProductById);
// slug-роут убран по твоему требованию
productsRouter.post("/", upload.single("file"), productsController.createProduct);
productsRouter.put("/:id", upload.single("file"), productsController.updateProduct);
productsRouter.delete("/:id", productsController.deleteProduct);

// ------- ИЗОБРАЖЕНИЯ -------
productsRouter.post("/:productId/images", upload.single("file"), productImagesController.uploadImage);
productsRouter.get("/:productId/images", productImagesController.getProductImages);
// primary-роут убран
productsRouter.delete("/images/:imageId", productImagesController.deleteImage);

export default productsRouter;
