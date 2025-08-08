// routes/productsRoutes.ts
import { Router } from "express";
import { productsController } from "../controllers/productsController";

const router = Router();

router.get("/", productsController.getProducts);
router.get("/:id", productsController.getProductById);
router.get("/slug/:slug", productsController.getProductBySlug);
router.post("/", productsController.createProduct);
router.put("/:id", productsController.updateProduct);
router.delete("/:id", productsController.deleteProduct);

export default router;
