import Booking from "../models/booking.model.js"; // Giả sử tên file là booking.model.js
import { ApiResponse } from "../utils/ApiResponse.js";
import nodemailer from "nodemailer";
import User from "../models/user.model.js";
import Service from "../models/service.model.js";
import mongoose from "mongoose";
import FavoriteStaff from "../models/favoriteStaff.model.js";

function removeVietnameseTones(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}
export const getAllBooking = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    // Chuyển đổi search thành không dấu
    const searchNonAccent = removeVietnameseTones(search);

    // Lấy dữ liệu từ các collection và áp dụng lọc ở ứng dụng
    const [bookings, totalBookings] = await Promise.all([
      Booking.find({})
        .sort({ bookingTime: 1 })
        .skip(skip)
        .limit(limit)
        .populate("customerId serviceId preferredStaffId assignedStaffId")
        .then((results) =>
          results.filter((booking) => {
            const customerName = booking.customerId?.name || "";
            const customerPhone = booking.customerId?.phone || "";
            const serviceName = booking.serviceId?.serviceName || "";
            const status = booking.status || "";

            return (
              removeVietnameseTones(customerName).includes(searchNonAccent) ||
              removeVietnameseTones(customerPhone).includes(searchNonAccent) ||
              removeVietnameseTones(serviceName).includes(searchNonAccent) ||
              removeVietnameseTones(status).includes(searchNonAccent)
            );
          })
        ),
      Booking.countDocuments(),
    ]);

    const totalPages = Math.ceil(totalBookings / limit);

    res
      .status(200)
      .send(
        new ApiResponse(
          200,
          { bookings, totalPages, currentPage: page },
          "Danh sách booking"
        )
      );
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send(new ApiResponse(500, error, "Lấy danh sách booking thất bại"));
  }
};

export const getBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId).populate(
      "customerId serviceId preferredStaffId assignedStaffId"
    );

    if (!booking) {
      return res
        .status(404)
        .send(new ApiResponse(404, null, "Không tìm thấy booking"));
    }

    res.status(200).send(new ApiResponse(200, booking, "Thông tin booking"));
  } catch (error) {
    console.error("Lỗi khi lấy thông tin booking:", error);
    res
      .status(500)
      .send(new ApiResponse(500, error, "Lấy thông tin booking thất bại"));
  }
};
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// API lấy thông tin booking và gửi email cho khách hàng
export const sendCustomerEmail = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId)
      .populate("customerId serviceId preferredStaffId")
      .exec();

    if (!booking) {
      return res
        .status(404)
        .send(new ApiResponse(404, null, "Không tìm thấy booking"));
    }

    const customer = booking.customerId;
    const service = booking.serviceId;

    if (customer && customer.email && service) {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: customer.email,
        subject: "Xác nhận đặt lịch thành công",
        html: `
          <div style="text-align: center;">
            <img src="https://cdn-icons-png.flaticon.com/512/7518/7518748.png" alt="Xác nhận thành công" style="width: 50px; height: 50px;" />
            <h2>Đặt lịch hẹn thành công!</h2>
            <p>Chúng tôi đã gửi thông tin chi tiết của bạn qua email.</p>
            <div style="margin-top: 20px;">
              <h3>Chi tiết lịch hẹn:</h3>
              <p><strong>Dịch vụ:</strong> ${service.serviceName}</p>
              <p><strong>Nhân viên:</strong> ${
                booking.preferredStaffId
                  ? booking.preferredStaffId.name
                  : "Không có"
              }</p>
              <p><strong>Khách hàng:</strong> ${customer.name}</p>
              <p><strong>Chi phí dự kiến:</strong> ${booking.totalCost.toLocaleString(
                "vi-VN"
              )} đ</p>
              <p><strong>Địa chỉ khách hàng:</strong> ${
                booking.customerAddress
              }</p>
              <p><strong>Thời gian:</strong> ${new Date(
                booking.bookingTime
              ).toLocaleDateString("vi-VN")} lúc ${new Date(
          booking.bookingTime
        ).toLocaleTimeString("vi-VN")}</p>
            </div>
            <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      return res
        .status(200)
        .send(new ApiResponse(200, null, "Email đã được gửi cho khách hàng"));
    } else {
      return res
        .status(404)
        .send(new ApiResponse(404, null, "Email của khách hàng không tồn tại"));
    }
  } catch (error) {
    console.error("Lỗi khi gửi email cho khách hàng:", error);
    res
      .status(500)
      .send(new ApiResponse(500, error, "Gửi email cho khách hàng thất bại"));
  }
};

// API gửi email cho nhân viên đã được chọn
export const sendStaffEmail = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId)
      .populate("customerId serviceId preferredStaffId")
      .exec();

    if (!booking) {
      return res
        .status(404)
        .send(new ApiResponse(404, null, "Không tìm thấy booking"));
    }

    const staff = booking.preferredStaffId;
    const service = booking.serviceId;

    if (staff && staff.email) {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: staff.email,
        subject: "Thông báo có lịch hẹn mới",
        html: `
          <div style="text-align: center;">
            <h2>Bạn có lịch hẹn mới!</h2>
            <div style="margin-top: 20px;">
              <h3>Chi tiết lịch hẹn:</h3>
              <p><strong>Dịch vụ:</strong> ${service.serviceName}</p>
              <p><strong>Khách hàng:</strong> ${booking.customerId.name}</p>
              <p><strong>Địa chỉ khách hàng:</strong> ${
                booking.customerAddress
              }</p>
              <p><strong>Chi phí dự kiến:</strong> ${booking.totalCost.toLocaleString(
                "vi-VN"
              )} đ</p>
              <p><strong>Thời gian:</strong> ${new Date(
                booking.bookingTime
              ).toLocaleDateString("vi-VN")} lúc ${new Date(
          booking.bookingTime
        ).toLocaleTimeString("vi-VN")}</p>
            </div>
            <p>Vui lòng chuẩn bị cho cuộc hẹn này!</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      return res
        .status(200)
        .send(new ApiResponse(200, null, "Email đã được gửi cho nhân viên"));
    } else {
      return res
        .status(404)
        .send(new ApiResponse(404, null, "Email của nhân viên không tồn tại"));
    }
  } catch (error) {
    console.error("Lỗi khi gửi email cho nhân viên:", error);
    res
      .status(500)
      .send(new ApiResponse(500, error, "Gửi email cho nhân viên thất bại"));
  }
};

// Tạo booking và trả về bookingId
export const createBooking = async (req, res) => {
  try {
    const {
      customerId,
      serviceId,
      preferredStaffId,
      status,
      bookingTime,
      totalCost,
      customerAddress,
      staffDiscount, // Thêm staffDiscount vào đây
    } = req.body;

    // Kiểm tra các trường bắt buộc
    if (
      !customerId ||
      !serviceId ||
      !status ||
      !customerAddress ||
      !bookingTime
    ) {
      return res
        .status(400)
        .send(new ApiResponse(400, null, "Thiếu các trường bắt buộc"));
    }

    const requestedBookingTime = new Date(bookingTime);
    const twoHoursInMs = 2 * 60 * 60 * 1000;

    // Kiểm tra nếu nhân viên được chọn đã có booking trong vòng 2 giờ của thời gian yêu cầu
    if (preferredStaffId) {
      const existingBooking = await Booking.findOne({
        preferredStaffId,
        bookingTime: {
          $gte: new Date(requestedBookingTime - twoHoursInMs),
          $lte: new Date(requestedBookingTime + twoHoursInMs),
        },
      });

      if (existingBooking) {
        return res
          .status(400)
          .send(
            new ApiResponse(
              400,
              null,
              "Nhân viên đã có lịch trong vòng 2 tiếng gần thời gian yêu cầu"
            )
          );
      }
    }

    const newBooking = new Booking({
      customerId,
      serviceId,
      preferredStaffId,
      status,
      bookingTime,
      totalCost,
      customerAddress,
      staffDiscount: staffDiscount || 0, // Lưu staffDiscount, mặc định là 0 nếu không có
    });

    await newBooking.save();

    res
      .status(201)
      .send(
        new ApiResponse(
          201,
          { bookingId: newBooking._id },
          "Tạo booking thành công"
        )
      );
  } catch (error) {
    console.error("Lỗi khi tạo booking:", error);
    res.status(500).send(new ApiResponse(500, error, "Tạo booking thất bại"));
  }
};

export const changeStatusBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, rejectionReason } = req.body;

    if (
      !status ||
      !["pending", "approved", "completed", "rejected"].includes(status)
    ) {
      return res
        .status(400)
        .send(new ApiResponse(400, null, "Trạng thái không hợp lệ"));
    }

    const booking = await Booking.findById(bookingId).populate(
      "customerId serviceId preferredStaffId"
    );

    if (!booking) {
      return res
        .status(404)
        .send(new ApiResponse(404, null, "Không tìm thấy booking"));
    }

    booking.status = status;

    if (status === "rejected") {
      booking.rejectionReason = rejectionReason || "Không có lý do cụ thể";
    }

    await booking.save();

    // Gửi email thông báo
    const customer = booking.customerId;
    const service = booking.serviceId;

    if (status === "approved") {
      // Gửi email thông báo xác nhận cho khách hàng
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: customer.email,
        subject: "Lịch hẹn của bạn đã được xác nhận",
        html: `
          <div style="text-align: center;">
            <h2>Lịch hẹn của bạn đã được xác nhận!</h2>
            <div style="margin-top: 20px;">
              <h3>Chi tiết lịch hẹn:</h3>
              <p><strong>Dịch vụ:</strong> ${service.serviceName}</p>
              <p><strong>Nhân viên:</strong> ${
                booking.preferredStaffId
                  ? booking.preferredStaffId.name
                  : "Không có"
              }</p>
              <p><strong>Thời gian:</strong> ${new Date(
                booking.bookingTime
              ).toLocaleDateString("vi-VN")} lúc ${new Date(
          booking.bookingTime
        ).toLocaleTimeString("vi-VN")}</p>
              <p><strong>Địa chỉ khách hàng:</strong> ${
                booking.customerAddress
              }</p>
            </div>
            <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
    } else if (status === "rejected") {
      // Gửi email từ chối cho khách hàng kèm lý do
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: customer.email,
        subject: "Lịch hẹn của bạn đã bị từ chối",
        html: `
          <div style="text-align: center;">
            <h2>Rất tiếc, lịch hẹn của bạn đã bị từ chối</h2>
            <div style="margin-top: 20px;">
              <h3>Chi tiết lịch hẹn:</h3>
              <p><strong>Dịch vụ:</strong> ${service.serviceName}</p>
              <p><strong>Nhân viên:</strong> ${
                booking.preferredStaffId
                  ? booking.preferredStaffId.name
                  : "Không có"
              }</p>
              <p><strong>Thời gian:</strong> ${new Date(
                booking.bookingTime
              ).toLocaleDateString("vi-VN")} lúc ${new Date(
          booking.bookingTime
        ).toLocaleTimeString("vi-VN")}</p>
              <p><strong>Địa chỉ khách hàng:</strong> ${
                booking.customerAddress
              }</p>
              <p><strong>Lý do từ chối:</strong> ${
                rejectionReason || "Không có lý do cụ thể"
              }</p>
            </div>
            <p>Xin cảm ơn bạn đã quan tâm đến dịch vụ của chúng tôi.</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
    }

    res
      .status(200)
      .send(
        new ApiResponse(200, booking, "Cập nhật trạng thái booking thành công")
      );
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái booking:", error);
    res
      .status(500)
      .send(
        new ApiResponse(500, error, "Cập nhật trạng thái booking thất bại")
      );
  }
};

export const getBookingByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Lấy danh sách staff yêu thích của user
    const favoriteStaffIds = await FavoriteStaff.find({
      customerId: new mongoose.Types.ObjectId(userId),
    }).distinct("staffId");

    const bookings = await Booking.aggregate([
      {
        $match: { customerId: new mongoose.Types.ObjectId(userId) },
      },
      {
        $sort: { bookingTime: -1 },
      },
      { $skip: skip },
      { $limit: limit },

      // Populate thông tin khách hàng, dịch vụ, nhân viên ưa thích, và nhân viên được giao
      {
        $lookup: {
          from: "users",
          localField: "customerId",
          foreignField: "_id",
          as: "customerInfo",
        },
      },
      {
        $lookup: {
          from: "services",
          localField: "serviceId",
          foreignField: "_id",
          as: "serviceInfo",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "preferredStaffId",
          foreignField: "_id",
          as: "preferredStaffInfo",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "assignedStaffId",
          foreignField: "_id",
          as: "assignedStaffInfo",
        },
      },

      // Lookup Feedback để xác định nếu booking đã được đánh giá
      {
        $lookup: {
          from: "feedbacks",
          let: { bookingId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$bookingId", "$$bookingId"] } } },
          ],
          as: "feedback",
        },
      },
      {
        $addFields: {
          feedbackExists: { $gt: [{ $size: "$feedback" }, 0] },
        },
      },

      // Check if preferredStaffId là staff yêu thích của user
      {
        $addFields: {
          isFavorite: {
            $cond: {
              if: { $in: ["$preferredStaffId", favoriteStaffIds] },
              then: true,
              else: false,
            },
          },
        },
      },

      // Cleanup các trường populate thành đối tượng đơn
      { $unwind: "$customerInfo" },
      { $unwind: "$serviceInfo" },
      {
        $unwind: {
          path: "$preferredStaffInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$assignedStaffInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);

    const totalBookings = await Booking.countDocuments({
      customerId: new mongoose.Types.ObjectId(userId),
    });
    const totalPages = Math.ceil(totalBookings / limit);

    res
      .status(200)
      .send(
        new ApiResponse(
          200,
          { bookings, totalPages, currentPage: page },
          "Lịch sử đặt lịch của người dùng"
        )
      );
  } catch (error) {
    console.error("Lỗi khi lấy lịch sử đặt lịch của người dùng:", error);
    res
      .status(500)
      .send(new ApiResponse(500, error, "Lấy lịch sử đặt lịch thất bại"));
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    // Tìm booking theo ID và populate 'preferredStaffId' và 'serviceId'
    const booking = await Booking.findById(bookingId).populate(
      "preferredStaffId serviceId"
    );

    if (!booking) {
      return res
        .status(404)
        .send(new ApiResponse(404, null, "Không tìm thấy booking"));
    }

    // Kiểm tra trạng thái của booking
    if (booking.status !== "pending") {
      return res
        .status(400)
        .send(
          new ApiResponse(
            400,
            null,
            "Chỉ có thể hủy booking ở trạng thái pending"
          )
        );
    }

    // Cập nhật trạng thái booking thành 'canceled'
    booking.status = "canceled";
    await booking.save();

    // Gửi email cho nhân viên khi booking bị hủy
    if (booking.preferredStaffId && booking.preferredStaffId.email) {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: booking.preferredStaffId.email,
        subject: "Thông báo hủy đặt lịch",
        text: `Xin chào ${booking.preferredStaffId.name},\n\nKhách hàng đã hủy đặt lịch dịch vụ "${booking.serviceId.serviceName}" với mã đặt lịch ${bookingId}.\n\nXin vui lòng kiểm tra lại thông tin và cập nhật trạng thái của mình.\n\nTrân trọng,\nĐội ngũ hỗ trợ.`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Lỗi khi gửi email:", error);
        } else {
          console.log("Email đã được gửi:", info.response);
        }
      });
    }

    res
      .status(200)
      .send(new ApiResponse(200, booking, "Hủy booking thành công"));
  } catch (error) {
    console.error("Lỗi khi hủy booking:", error);
    res.status(500).send(new ApiResponse(500, error, "Hủy booking thất bại"));
  }
};
export const getBookingByStaffId = async (req, res) => {
  try {
    const { staffId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Tìm các booking có preferredStaffId hoặc assignedStaffId là staffId
    const query = {
      $or: [{ preferredStaffId: staffId }, { assignedStaffId: staffId }],
    };

    const [bookings, totalBookings] = await Promise.all([
      Booking.find(query)
        .sort({ bookingTime: -1 }) // Sắp xếp theo bookingTime giảm dần (mới nhất đến cũ nhất)
        .skip(skip)
        .limit(limit)
        .populate("customerId serviceId preferredStaffId assignedStaffId"),
      Booking.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalBookings / limit);

    res
      .status(200)
      .send(
        new ApiResponse(
          200,
          { bookings, totalPages, currentPage: page },
          "Lịch sử đặt lịch của nhân viên"
        )
      );
  } catch (error) {
    console.error("Lỗi khi lấy lịch sử đặt lịch của nhân viên:", error);
    res
      .status(500)
      .send(new ApiResponse(500, error, "Lấy lịch sử đặt lịch thất bại"));
  }
};
export const completeBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { actualAmountReceived, completionTime } = req.body;

    // Tìm booking theo ID
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res
        .status(404)
        .send(new ApiResponse(404, null, "Không tìm thấy booking"));
    }

    // Kiểm tra trạng thái hiện tại và cập nhật nếu cần
    if (booking.status === "completed") {
      return res
        .status(400)
        .send(new ApiResponse(400, null, "Booking đã hoàn thành trước đó"));
    }

    // Cập nhật trạng thái, số tiền thực tế nhận và thời gian hoàn thành
    booking.status = "completed";
    booking.actualAmountReceived = actualAmountReceived;
    booking.completionTime = completionTime;

    // Lưu các thay đổi
    await booking.save();

    res
      .status(200)
      .send(
        new ApiResponse(200, booking, "Đặt lịch đã được hoàn thành thành công")
      );
  } catch (error) {
    console.error("Lỗi khi hoàn thành booking:", error);
    res
      .status(500)
      .send(new ApiResponse(500, error, "Hoàn thành booking thất bại"));
  }
};
export const changeBookingStaff = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { preferredStaffId } = req.body;

    // Kiểm tra xem preferredStaffId có được cung cấp hay không
    if (!preferredStaffId) {
      return res
        .status(400)
        .send(
          new ApiResponse(400, null, "Vui lòng cung cấp preferredStaffId.")
        );
    }

    // Tìm và cập nhật preferredStaffId cho booking
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { preferredStaffId },
      { new: true } // Trả về tài liệu đã cập nhật
    ).populate("preferredStaffId");

    if (!updatedBooking) {
      return res
        .status(404)
        .send(new ApiResponse(404, null, "Không tìm thấy lịch hẹn."));
    }

    res
      .status(200)
      .send(
        new ApiResponse(
          200,
          updatedBooking,
          "Cập nhật preferredStaffId thành công."
        )
      );
  } catch (error) {
    console.error("Lỗi khi cập nhật preferredStaffId cho lịch hẹn:", error);
    res
      .status(500)
      .send(new ApiResponse(500, null, "Cập nhật preferredStaffId thất bại."));
  }
};
