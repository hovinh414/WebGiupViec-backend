import express from "express";
import multer from "multer";
import {
  registerUser,
  loginUser,
  registerStaff,
} from "../controllers/auth.controller.js";

const authRouter = express.Router();

// Cấu hình multer trực tiếp
const upload = multer({
  storage: multer.memoryStorage(), // Sử dụng bộ nhớ trong RAM để lưu file tạm thời
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn kích thước file là 5MB
});

// Route đăng ký người dùng mới
authRouter.post("/register", registerUser);

// Route đăng ký nhân viên mới với hỗ trợ upload CV
authRouter.post("/register-staff", upload.single("cv"), registerStaff);

// Route đăng nhập người dùng
authRouter.post("/login", loginUser);

export { authRouter };
