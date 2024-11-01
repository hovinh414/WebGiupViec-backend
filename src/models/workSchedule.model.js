import mongoose from "mongoose";

// Định nghĩa Schema cho WorkSchedule
const WorkScheduleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Liên kết với bảng User
  days: [
    {
      day: {
        type: String,
        enum: [
          "Thứ Hai",
          "Thứ Ba",
          "Thứ Tư",
          "Thứ Năm",
          "Thứ Sáu",
          "Thứ Bảy",
          "Chủ Nhật",
        ],
        required: true,
      },
      startTime: { type: String, required: false, default: "08:00" }, // Mặc định là "08:00"
      endTime: { type: String, required: false, default: "19:00" }, // Mặc định là "19:00"
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

// Tạo model WorkSchedule
const WorkSchedule = mongoose.model("WorkSchedule", WorkScheduleSchema);

export default WorkSchedule;
