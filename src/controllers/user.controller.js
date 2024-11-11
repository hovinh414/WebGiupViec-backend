import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import { ApiResponse } from "../utils/ApiResponse.js";
import moment from "moment";
import WorkSchedule from "../models/workSchedule.model.js";
import Service from "../models/service.model.js";
import FavoriteStaff from "../models/favoriteStaff.model.js";
import mongoose from "mongoose";

// Cấu hình moment sử dụng tiếng Việt
moment.locale("vi");
export const getAllInactiveStaffAccounts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [inactiveStaffAccounts, totalAccounts] = await Promise.all([
      User.find({ active: false, role: "staff" }).skip(skip).limit(limit),
      User.countDocuments({ active: false, role: "staff" }),
    ]);

    const totalPages = Math.ceil(totalAccounts / limit);

    res
      .status(200)
      .send(
        new ApiResponse(
          200,
          { inactiveStaffAccounts, totalPages, currentPage: page },
          "Danh sách tài khoản staff chưa kích hoạt"
        )
      );
  } catch (error) {
    console.error(error);
    res.status(500).send(new ApiResponse(500, error, "Lấy danh sách thất bại"));
  }
};

// API approveAccount - kích hoạt tài khoản và gửi mật khẩu ngẫu nhiên qua email
export const approveAccount = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findOne({
      _id: userId,
      role: "staff",
      active: false,
    });
    if (!user) {
      return res
        .status(404)
        .send(
          new ApiResponse(
            404,
            null,
            "Không tìm thấy tài khoản chưa kích hoạt của staff"
          )
        );
    }

    const randomPassword = "123456aA@";
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    user.password = hashedPassword;
    user.active = true;
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Tài khoản của bạn đã được kích hoạt",
      text: `Tài khoản của bạn đã được kích hoạt thành công. Mật khẩu của bạn là: 123456aA@`,
    };

    await transporter.sendMail(mailOptions);

    res
      .status(200)
      .send(
        new ApiResponse(
          200,
          null,
          "Tài khoản đã được kích hoạt và email đã được gửi"
        )
      );
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send(new ApiResponse(500, error, "Kích hoạt tài khoản thất bại"));
  }
};

// API rejectAccount - từ chối và xóa tài khoản khỏi DB, đồng thời gửi email thông báo
export const rejectAccount = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findOneAndDelete({
      _id: userId,
      role: "staff",
      active: false,
    });

    if (!user) {
      return res
        .status(404)
        .send(
          new ApiResponse(
            404,
            null,
            "Không tìm thấy tài khoản chưa kích hoạt của staff để từ chối"
          )
        );
    }

    // Cấu hình gửi email thông báo từ chối
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Nội dung email thông báo từ chối
    const rejectionMessage = `
      Kính gửi ${user.name},

      Cảm ơn bạn đã quan tâm đến vị trí tại công ty chúng tôi và đã dành thời gian tham gia phỏng vấn. 
      Sau khi xem xét cẩn thận tất cả các yếu tố và nhu cầu hiện tại của công ty, 
      chúng tôi rất tiếc phải thông báo rằng hồ sơ của bạn đã không được chấp nhận cho vị trí này.

      Chúng tôi đánh giá cao nỗ lực của bạn và hy vọng sẽ có cơ hội hợp tác với bạn trong tương lai khi có vị trí phù hợp hơn.

      Trân trọng,
      Đội ngũ tuyển dụng
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Thông báo từ chối hồ sơ",
      text: rejectionMessage,
    };

    // Gửi email
    await transporter.sendMail(mailOptions);

    res
      .status(200)
      .send(
        new ApiResponse(
          200,
          null,
          "Tài khoản đã bị từ chối và xóa khỏi hệ thống, email thông báo đã được gửi"
        )
      );
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send(new ApiResponse(500, error, "Từ chối tài khoản thất bại"));
  }
};
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("-password"); // Loại bỏ mật khẩu khỏi phản hồi
    if (!user) {
      return res
        .status(404)
        .send(new ApiResponse(404, null, "Không tìm thấy người dùng"));
    }

    res.status(200).send(new ApiResponse(200, user, "Thông tin người dùng"));
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send(new ApiResponse(500, error, "Lỗi khi lấy thông tin người dùng"));
  }
};
export const changePassword = async (req, res) => {
  try {
    const { userId } = req.params; // Lấy userId từ tham số URL
    const { currentPassword, newPassword } = req.body;

    // Tiếp tục như trước với việc kiểm tra user, xác minh mật khẩu và cập nhật mật khẩu mới
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .send(new ApiResponse(404, null, "Không tìm thấy người dùng"));
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .send(new ApiResponse(400, null, "Mật khẩu hiện tại không chính xác"));
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).send(new ApiResponse(200, null, "Đổi mật khẩu thành công"));
  } catch (error) {
    console.error("Lỗi khi đổi mật khẩu:", error);
    res.status(500).send(new ApiResponse(500, error, "Đổi mật khẩu thất bại"));
  }
};
export const getAllStaffByServiceId = async (req, res) => {
  try {
    const { serviceId } = req.params;
    let { bookingTime, userId, address } = req.query; // Lấy `address` từ `req.query`

    // Chuẩn hóa định dạng `bookingTime`
    if (
      bookingTime &&
      !bookingTime.includes("+") &&
      bookingTime.includes(" ")
    ) {
      bookingTime = bookingTime.replace(" ", "+");
    }

    const bookingDate = moment(bookingTime, moment.ISO_8601, true);

    if (!bookingDate.isValid()) {
      return res
        .status(400)
        .send(new ApiResponse(400, null, "Định dạng bookingTime không hợp lệ"));
    }

    // Lấy danh sách nhân viên có `active: true`, `serviceId` chỉ định và `address` khớp với địa chỉ từ `req.query`
    const staffList = await User.find({
      role: "staff",
      active: true,
      serviceIds: serviceId,
      address, // Kiểm tra `address` của nhân viên khớp với `address` từ `req.query`
    }).select("-password");

    // Lấy danh sách `staffId` được yêu thích của `userId`
    const favoriteStaffIds = await FavoriteStaff.find({
      customerId: new mongoose.Types.ObjectId(userId),
    }).distinct("staffId");

    const availableStaff = [];

    for (const staff of staffList) {
      // Lấy lịch làm việc của nhân viên
      const workSchedule = await WorkSchedule.findOne({ userId: staff._id });
      if (!workSchedule || !workSchedule.days) continue;

      // Lấy ngày đặt lịch ở dạng tiếng Việt
      const bookingDayInVietnamese = bookingDate.format("dddd").toLowerCase();

      // Tìm lịch làm việc phù hợp với `bookingDate`
      const daySchedule = workSchedule.days.find(
        (day) => day.day.toLowerCase() === bookingDayInVietnamese
      );

      // Bỏ qua nếu không có lịch làm việc cho ngày này
      if (!daySchedule || !daySchedule.startTime || !daySchedule.endTime)
        continue;

      // Chuyển đổi `startTime` và `endTime` từ lịch làm việc sang `moment` và kiểm tra khoảng thời gian
      const startTime = moment(daySchedule.startTime, "HH:mm");
      const endTime = moment(daySchedule.endTime, "HH:mm");
      const bookingMoment = moment(bookingDate.format("HH:mm"), "HH:mm");

      // Kiểm tra nếu `bookingMoment` nằm trong khoảng `startTime` và `endTime`
      if (bookingMoment.isBetween(startTime, endTime, null, "[)")) {
        // Kiểm tra xem `staff._id` có nằm trong danh sách yêu thích không
        const isFavorite = favoriteStaffIds
          .map((id) => id.toString())
          .includes(staff._id.toString());

        availableStaff.push({ ...staff.toObject(), isFavorite });
      }
    }

    // Sắp xếp danh sách nhân viên: nhân viên yêu thích sẽ ở đầu danh sách
    availableStaff.sort((a, b) => b.isFavorite - a.isFavorite);

    res
      .status(200)
      .send(
        new ApiResponse(
          200,
          availableStaff,
          "Danh sách staff có lịch làm việc phù hợp với bookingTime và cùng địa chỉ"
        )
      );
  } catch (error) {
    console.error("Lỗi khi lấy danh sách staff:", error);
    res
      .status(500)
      .send(new ApiResponse(500, error, "Lỗi khi lấy danh sách staff"));
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, phone, address, avatar, age } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .send(new ApiResponse(404, null, "Không tìm thấy người dùng"));
    }

    // Cập nhật thông tin hồ sơ
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (avatar) user.avatar = avatar;
    if (age) user.age = age;

    await user.save();

    // Trả về thông tin cập nhật
    res
      .status(200)
      .send(
        new ApiResponse(200, { user }, "Cập nhật thông tin hồ sơ thành công")
      );
  } catch (error) {
    console.error("Lỗi khi cập nhật hồ sơ:", error);
    res
      .status(500)
      .send(new ApiResponse(500, error, "Cập nhật hồ sơ thất bại"));
  }
};
export const getAllUser = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    const query = {
      $or: [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    };

    const [users, totalUsers] = await Promise.all([
      User.find(query)
        .sort({ role: 1 }) // Sắp xếp tăng dần theo role (1: tăng dần, -1: giảm dần)
        .skip(skip)
        .limit(limit)
        .select("-password"),
      User.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalUsers / limit);

    res
      .status(200)
      .send(
        new ApiResponse(
          200,
          { users, totalPages, currentPage: page },
          "Danh sách người dùng"
        )
      );
  } catch (error) {
    console.error("Lỗi khi lấy danh sách người dùng:", error);
    res
      .status(500)
      .send(new ApiResponse(500, error, "Lấy danh sách người dùng thất bại"));
  }
};

export const createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      address,
      role,
      avatar,
      serviceIds,
      age,
      discountPercentage, // Thêm discountPercentage vào dữ liệu đầu vào
    } = req.body;

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .send(new ApiResponse(400, null, "Email đã tồn tại"));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      address,
      role,
      avatar,
      serviceIds,
      active: true,
      age,
      discountPercentage: discountPercentage || 0, // Thiết lập giá trị mặc định là 0 nếu không có dữ liệu
    });

    await user.save();

    res
      .status(201)
      .send(new ApiResponse(201, user, "Tạo người dùng thành công"));
  } catch (error) {
    console.error("Lỗi khi tạo người dùng:", error);
    res
      .status(500)
      .send(new ApiResponse(500, error, "Tạo người dùng thất bại"));
  }
};

export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      name,
      email,
      phone,
      address,
      avatar,
      role,
      serviceIds,
      age,
      discountPercentage, // Thêm discountPercentage vào dữ liệu đầu vào
    } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .send(new ApiResponse(404, null, "Không tìm thấy người dùng"));
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (avatar) user.avatar = avatar;
    if (role) user.role = role;
    if (serviceIds) user.serviceIds = serviceIds;
    if (age) user.age = age;
    if (discountPercentage !== undefined)
      user.discountPercentage = discountPercentage;

    await user.save();

    res
      .status(200)
      .send(new ApiResponse(200, user, "Cập nhật người dùng thành công"));
  } catch (error) {
    console.error("Lỗi khi cập nhật người dùng:", error);
    res
      .status(500)
      .send(new ApiResponse(500, error, "Cập nhật người dùng thất bại"));
  }
};

export const lockUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .send(new ApiResponse(404, null, "Không tìm thấy người dùng"));
    }

    // Đổi trạng thái active: nếu true -> false, nếu false -> true
    user.active = !user.active;
    await user.save();

    const message = user.active
      ? "Tài khoản người dùng đã được mở khóa"
      : "Tài khoản người dùng đã bị khóa";

    res.status(200).send(new ApiResponse(200, user, message));
  } catch (error) {
    console.error("Lỗi khi thay đổi trạng thái người dùng:", error);
    res
      .status(500)
      .send(
        new ApiResponse(500, error, "Thay đổi trạng thái người dùng thất bại")
      );
  }
};

export const getAllStaff = async (req, res) => {
  try {
    console.log("Fetching staff members...");
    const staffMembers = await User.find({ role: "staff", active: true });
    console.log("Found staff members:", staffMembers);
    res
      .status(200)
      .send(new ApiResponse(200, staffMembers, "Danh sách nhân viên"));
  } catch (error) {
    console.error("Lỗi khi lấy danh sách nhân viên:", error);
    res
      .status(500)
      .send(new ApiResponse(500, null, "Lấy danh sách nhân viên thất bại"));
  }
};
