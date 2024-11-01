import express from "express";
import {
  getAllBooking,
  createBooking,
  changeStatusBooking,
  getBookingById,
  sendCustomerEmail, // Controller gửi email cho khách hàng
  sendStaffEmail, // Controller gửi email cho nhân viên
  cancelBooking, // Controller hủy đặt lịch
  getBookingByUserId,
  getBookingByStaffId, // Controller lấy lịch sử đặt lịch theo userId
  completeBooking,
  changeBookingStaff, // Controller hoàn thành booking
} from "../controllers/booking.controller.js";
import { checkAuth } from "../middlewares/auth.middleware.js";

const bookingRouter = express.Router();

// Route để lấy tất cả các booking có phân trang và tìm kiếm
bookingRouter.get("/", checkAuth, getAllBooking);

// Route để tạo mới booking
bookingRouter.post("/", checkAuth, createBooking);

// Route để thay đổi trạng thái booking
bookingRouter.patch("/:bookingId/status", checkAuth, changeStatusBooking);

// Route để lấy chi tiết booking theo ID
bookingRouter.get("/:bookingId", checkAuth, getBookingById);

// Route gửi email xác nhận cho khách hàng
bookingRouter.post(
  "/:bookingId/send-customer-email",
  checkAuth,
  sendCustomerEmail
);

// Route gửi email thông báo cho nhân viên
bookingRouter.post("/:bookingId/send-staff-email", checkAuth, sendStaffEmail);

// Route hủy booking nếu trạng thái là pending
bookingRouter.put("/:bookingId/cancel", checkAuth, cancelBooking);

// Route để lấy lịch sử đặt lịch của người dùng theo userId
bookingRouter.get("/user/:userId", checkAuth, getBookingByUserId);

// Route để lấy lịch sử đặt lịch của nhân viên theo staffId
bookingRouter.get("/staff/:staffId", checkAuth, getBookingByStaffId);

// Route hoàn thành booking và cập nhật số tiền thực tế nhận cùng thời gian hoàn thành
bookingRouter.patch("/:bookingId/complete", checkAuth, completeBooking);
bookingRouter.put("/change-staff/:bookingId", checkAuth, changeBookingStaff);
export { bookingRouter };
