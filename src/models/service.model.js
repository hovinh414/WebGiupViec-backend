import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
  serviceName: { type: String, required: true },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category", // Liên kết đến model Category
    required: true,
  },
  shortDescription: { type: String }, // Mô tả ngắn
  fullDescription: { type: String }, // Mô tả đầy đủ dưới dạng HTML
  description: { type: String },
  basePrice: { type: Number, required: true },
  images: [{ type: String }], // Danh sách URL các ảnh mô tả dịch vụ
  address: { type: String }, // Địa chỉ của dịch vụ
  tasks: [
    {
      image: { type: String }, // URL của hình ảnh cho phần task
      title: { type: String }, // Tiêu đề của phần task
      taskList: [{ type: String }], // Danh sách các công việc (mỗi mục là một chuỗi)
    },
  ], // Mảng các tasks, mỗi task có hình ảnh, tiêu đề, và danh sách các công việc
});

const Service = mongoose.model("Service", serviceSchema);

export default Service;
