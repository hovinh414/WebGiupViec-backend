import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  customerAddress: {
    type: String,
    required: true,
  }, // Địa chỉ khách hàng
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service",
    required: true,
  },
  preferredStaffId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  bookingDate: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["pending", "approved", "completed", "rejected", "canceled"],
    required: true,
  },
  assignedStaffId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  bookingTime: { type: Date, required: true },
  startTime: { type: Date },
  endTime: { type: Date },
  totalCost: { type: Number, default: 0 },
  actualAmountReceived: { type: Number, default: 0 }, // Số tiền thực tế nhận từ khách
  completionTime: { type: Date }, // Thời gian hoàn thành booking
  rejectionReason: { type: String }, // Lý do từ chối booking
  staffDiscount: { type: Number, default: 0 }, // Phần trăm chiết khấu của nhân viên
});

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
