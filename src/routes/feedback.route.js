import express from "express";
import {
  createFeedback,
  getAllFeedbacks,
  getFeedbackByServiceId, // Import hàm getFeedbackByServiceId
} from "../controllers/feedback.controller.js"; // Controller quản lý feedback
import { checkAuth } from "../middlewares/auth.middleware.js";
import multer from "multer";

// Cấu hình Multer để lưu trữ tạm thời hình ảnh trong bộ nhớ
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const feedbackRouter = express.Router();

// Route lấy tất cả các feedback
feedbackRouter.route("/").get(getAllFeedbacks); // Lấy tất cả feedback

// Route tạo feedback mới với hình ảnh (sử dụng upload.array để nhận nhiều hình ảnh)
feedbackRouter
  .route("/")
  .post(checkAuth, upload.array("images", 5), createFeedback); // Tạo feedback mới, cần xác thực

// Route mới để lấy danh sách feedback theo serviceId với phân trang
feedbackRouter.route("/service/:serviceId").get(getFeedbackByServiceId); // Lấy feedback theo serviceId

export { feedbackRouter };
