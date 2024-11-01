import Feedback from "../models/feedback.model.js";
import { uploadImageToFirebase } from "../services/firebase.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const createFeedback = async (req, res) => {
  try {
    const { customerId, userId, serviceId, bookingId, rating, comment } =
      req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res
        .status(400)
        .send(new ApiResponse(400, null, "Rating phải từ 1 đến 5"));
    }

    // Upload each image to Firebase and store URLs in images array
    let images = [];
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) =>
        uploadImageToFirebase(file.buffer, file.originalname, true)
      );
      images = await Promise.all(uploadPromises);
    }

    // Create new feedback with images and bookingId
    const newFeedback = new Feedback({
      customerId,
      userId,
      serviceId,
      bookingId, // Bổ sung bookingId vào phản hồi
      rating,
      comment,
      images,
    });

    await newFeedback.save();

    res
      .status(201)
      .send(
        new ApiResponse(201, newFeedback, "Phản hồi đã được tạo thành công")
      );
  } catch (error) {
    console.error("Lỗi khi tạo phản hồi:", error);
    res.status(500).send(new ApiResponse(500, error, "Tạo phản hồi thất bại"));
  }
};

// Lấy tất cả phản hồi với phân trang và lọc theo `customerId`, `userId`, hoặc `serviceId`
export const getAllFeedbacks = async (req, res) => {
  try {
    const { page = 1, limit = 10, customerId, userId, serviceId } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (customerId) query.customerId = customerId;
    if (userId) query.userId = userId;
    if (serviceId) query.serviceId = serviceId;

    const [feedbacks, totalFeedbacks] = await Promise.all([
      Feedback.find(query)
        .populate("customerId", "name")
        .populate("userId", "name")
        .populate("serviceId", "serviceName")
        .skip(parseInt(skip))
        .limit(parseInt(limit)),
      Feedback.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalFeedbacks / limit);

    res.status(200).send(
      new ApiResponse(
        200,
        {
          feedbacks,
          totalFeedbacks,
          currentPage: parseInt(page),
          totalPages,
        },
        "Danh sách phản hồi"
      )
    );
  } catch (error) {
    console.error("Lỗi khi lấy danh sách phản hồi:", error);
    res
      .status(500)
      .send(new ApiResponse(500, error, "Lấy danh sách phản hồi thất bại"));
  }
};
// Lấy phản hồi theo `serviceId` với phân trang
export const getFeedbackByServiceId = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const query = { serviceId };

    const [feedbacks, totalFeedbacks] = await Promise.all([
      Feedback.find(query)
        .populate("customerId") // Trả về tất cả các trường từ customerId
        .populate("userId") // Trả về tất cả các trường từ userId
        .populate("serviceId") // Trả về tất cả các trường từ serviceId
        .skip(parseInt(skip))
        .limit(parseInt(limit)),
      Feedback.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalFeedbacks / limit);

    res.status(200).send(
      new ApiResponse(
        200,
        {
          feedbacks,
          totalFeedbacks,
          currentPage: parseInt(page),
          totalPages,
        },
        "Danh sách phản hồi theo dịch vụ"
      )
    );
  } catch (error) {
    console.error("Lỗi khi lấy danh sách phản hồi theo dịch vụ:", error);
    res
      .status(500)
      .send(
        new ApiResponse(
          500,
          error,
          "Lấy danh sách phản hồi theo dịch vụ thất bại"
        )
      );
  }
};
