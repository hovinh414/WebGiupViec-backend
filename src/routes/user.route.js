import express from "express";
import { checkAuth } from "../middlewares/auth.middleware.js";
import {
  getAllInactiveStaffAccounts,
  approveAccount,
  rejectAccount,
  getUserById,
  changePassword,
  getAllStaffByServiceId,
  updateProfile,
  getAllUser, // Import controller getAllUser
  createUser, // Import controller createUser
  updateUser, // Import controller updateUser
  lockUser,
  getAllStaff, // Import controller lockUser
} from "../controllers/user.controller.js";

const userRouter = express.Router();
userRouter.get("/staff", checkAuth, getAllStaff);
// Route để lấy tất cả các tài khoản staff chưa kích hoạt
userRouter.get("/inactive-staff", checkAuth, getAllInactiveStaffAccounts);

// Route để approve tài khoản staff và gửi email
userRouter.put("/approve/:userId", checkAuth, approveAccount);

// Route để reject tài khoản staff và xóa tài khoản, đồng thời gửi email
userRouter.delete("/reject/:userId", checkAuth, rejectAccount);

// Route để lấy thông tin người dùng theo ID
userRouter.get("/:userId", checkAuth, getUserById);

// Route để thay đổi mật khẩu của người dùng
userRouter.post("/:userId/changepassword", checkAuth, changePassword);

// Route để lấy danh sách staff theo service ID
userRouter.get("/staff/service/:serviceId", checkAuth, getAllStaffByServiceId);

// Route để cập nhật hồ sơ người dùng
userRouter.put("/profile/:userId", checkAuth, updateProfile);

// Route để lấy tất cả người dùng (hỗ trợ phân trang và tìm kiếm)
userRouter.get("", checkAuth, getAllUser);

// Route để tạo người dùng mới
userRouter.post("/create", checkAuth, createUser);

// Route để cập nhật thông tin người dùng theo ID
userRouter.put("/:userId", checkAuth, updateUser);

// Route để khóa tài khoản người dùng
userRouter.put("/lock/:userId", checkAuth, lockUser);

export { userRouter };
