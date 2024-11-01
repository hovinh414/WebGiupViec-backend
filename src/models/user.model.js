import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import WorkSchedule from "./workSchedule.model.js"; // Import WorkSchedule model

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: false, unique: true, sparse: true },
  password: { type: String, required: false },
  phone: { type: String },
  address: { type: String },
  role: {
    type: String,
    enum: ["staff", "admin", "customer", "manager"],
    required: true,
  },
  avatar: { type: String },
  serviceIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Service" }],
  active: { type: Boolean, default: false },
  age: { type: Number, required: false },

  // New fields added
  cv: { type: String, required: false }, // Path to CV file or image
  discountPercentage: { type: Number, required: false, default: 0 }, // Discount percentage for company
});

// Generate access token
UserSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "1d" }
  );
};

// Generate refresh token
UserSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );
};

// Pre-save hook to create default work schedule for staff
UserSchema.pre("save", async function (next) {
  if (this.isNew && this.role === "staff") {
    const defaultDays = [
      { day: "Thứ Hai", startTime: "", endTime: "" },
      { day: "Thứ Ba", startTime: "", endTime: "" },
      { day: "Thứ Tư", startTime: "", endTime: "" },
      { day: "Thứ Năm", startTime: "", endTime: "" },
      { day: "Thứ Sáu", startTime: "", endTime: "" },
      { day: "Thứ Bảy", startTime: "", endTime: "" },
      { day: "Chủ Nhật", startTime: "", endTime: "" },
    ];

    try {
      await WorkSchedule.create({ userId: this._id, days: defaultDays });
    } catch (error) {
      return next(error);
    }
  }
  next();
});

const User = mongoose.model("User", UserSchema);
export default User;
