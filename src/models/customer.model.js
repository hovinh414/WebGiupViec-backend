const mongoose = require("mongoose");

const CustomerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  address: { type: String },
  avatar: { type: String }, // URL ảnh đại diện của khách hàng
  preferredServices: [{ type: mongoose.Schema.Types.ObjectId, ref: "Service" }], // Dịch vụ yêu thích
  preferredStaff: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Nhân viên yêu thích
});

module.exports = mongoose.model("Customer", CustomerSchema);
