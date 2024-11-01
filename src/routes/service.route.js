import express from "express";
import {
  createService,
  updateService,
  deleteService,
  getAllServices,
} from "../controllers/service.controller.js";
import { checkAuth } from "../middlewares/auth.middleware.js";
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const serviceRouter = express.Router();

// Route để lấy tất cả dịch vụ (có phân trang và lọc theo categoryId) và tạo dịch vụ mới
serviceRouter
  .route("/")
  .get(getAllServices) // Lấy tất cả dịch vụ với phân trang và lọc theo categoryId
  .post(checkAuth, upload.array("images"), createService); // Tạo dịch vụ mới với nhiều ảnh

// Route để cập nhật và xóa dịch vụ theo ID
serviceRouter
  .route("/:id")
  .put(checkAuth, upload.array("images"), updateService) // Cập nhật dịch vụ với nhiều ảnh
  .delete(checkAuth, deleteService); // Xóa dịch vụ

export { serviceRouter };
