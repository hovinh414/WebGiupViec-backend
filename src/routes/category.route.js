import express from "express";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  getAllCategories,
} from "../controllers/category.controller.js"; // Sử dụng một controller duy nhất
import { checkAuth } from "../middlewares/auth.middleware.js";
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const categoryRouter = express.Router();

categoryRouter
  .route("/")
  .get(getAllCategories)
  .post(checkAuth, upload.single("image"), createCategory);

categoryRouter
  .route("/:id")
  .put(checkAuth, upload.single("image"), updateCategory)
  .delete(checkAuth, deleteCategory);

export { categoryRouter };
