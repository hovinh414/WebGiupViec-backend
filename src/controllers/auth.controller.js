import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import { uploadFileToFirebase } from "../services/firebase.service.js";

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, address, role } = req.body;

    if (!name || !email || !password || !phone || !role) {
      return res
        .status(400)
        .send(new ApiResponse(400, null, "Thiếu các trường bắt buộc"));
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .send(new ApiResponse(400, null, "Định dạng email không hợp lệ"));
    }

    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res
        .status(409)
        .send(new ApiResponse(409, null, "Người dùng với email đã tồn tại"));
    }

    const phoneExists = await User.findOne({ phone });
    if (phoneExists) {
      return res
        .status(409)
        .send(
          new ApiResponse(409, null, "Người dùng với số điện thoại đã tồn tại")
        );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Set active to false if the role is staff
    const isActive = role === "staff" ? false : true;

    const createdUser = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      address,
      role,
      active: isActive,
    });

    const userResponse = await User.findById(createdUser._id).select(
      "-password -__v"
    );

    res
      .status(201)
      .send(
        new ApiResponse(
          201,
          { user: userResponse },
          "Đăng ký người dùng thành công. Vui lòng chờ quản trị viên phê duyệt nếu bạn là nhân viên."
        )
      );
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .send(new ApiResponse(500, error, "Đăng ký người dùng thất bại"));
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .send(new ApiResponse(400, null, "Thiếu các trường bắt buộc"));
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .send(
          new ApiResponse(
            404,
            null,
            "Không tồn tại người dùng với email này, vui lòng đăng ký trước!"
          )
        );
    }

    // Check if user is active
    if (!user.active) {
      return res
        .status(403)
        .send(
          new ApiResponse(
            403,
            null,
            "Tài khoản chưa được kích hoạt. Vui lòng chờ quản trị viên phê duyệt."
          )
        );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res
        .status(401)
        .send(
          new ApiResponse(401, null, "Thông tin đăng nhập không chính xác")
        );
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    res.cookie("at", accessToken, { httpOnly: true, secure: true });
    res.cookie("rt", refreshToken, { httpOnly: true, secure: true });

    const userResponse = await User.findById(user._id).select("-password -__v");

    res
      .status(200)
      .send(
        new ApiResponse(
          200,
          { user: userResponse, accessToken, refreshToken },
          "Đăng nhập thành công"
        )
      );
  } catch (error) {
    console.log(error);
    res.status(500).send(new ApiResponse(500, error, "Đăng nhập thất bại"));
  }
};

export const registerStaff = async (req, res) => {
  try {
    const { name, phone, age, serviceIds, address, email } = req.body;

    // Kiểm tra các trường bắt buộc
    if (
      !name ||
      !phone ||
      !age ||
      !serviceIds ||
      !email ||
      serviceIds.length === 0
    ) {
      return res
        .status(400)
        .send(new ApiResponse(400, null, "Thiếu các trường bắt buộc"));
    }

    // Kiểm tra số điện thoại và email đã tồn tại
    const phoneExists = await User.findOne({ phone });
    if (phoneExists) {
      return res
        .status(409)
        .send(
          new ApiResponse(409, null, "Người dùng với số điện thoại đã tồn tại")
        );
    }

    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res
        .status(409)
        .send(
          new ApiResponse(409, null, "Người dùng với email này đã tồn tại")
        );
    }

    // Kiểm tra định dạng serviceIds
    if (
      !Array.isArray(serviceIds) ||
      !serviceIds.every((id) => mongoose.Types.ObjectId.isValid(id))
    ) {
      return res
        .status(400)
        .send(new ApiResponse(400, null, "Định dạng serviceIds không hợp lệ"));
    }

    // Upload CV nếu có file
    let cvUrl = "";
    if (req.file) {
      const contentType = req.file.mimetype;
      const fileBuffer = req.file.buffer;
      const fileName = req.file.originalname;

      // Upload CV lên Firebase và lấy URL
      cvUrl = await uploadFileToFirebase(fileBuffer, fileName, contentType);
    }

    // Tạo tài khoản nhân viên mới với URL của CV
    const createdUser = await User.create({
      name,
      phone,
      email,
      age,
      serviceIds,
      address,
      role: "staff",
      active: false,
      cv: cvUrl, // Lưu URL của CV vào database
    });

    res
      .status(201)
      .send(
        new ApiResponse(
          201,
          { user: createdUser },
          "Đăng ký nhân viên thành công. Vui lòng chờ quản trị viên phê duyệt."
        )
      );
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send(new ApiResponse(500, error, "Đăng ký nhân viên thất bại"));
  }
};

export const approveStaff = async (req, res) => {
  try {
    const { userId } = req.params;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { active: true },
      { new: true }
    );

    if (!updatedUser) {
      return res
        .status(404)
        .send(new ApiResponse(404, null, "Không tìm thấy người dùng"));
    }

    res
      .status(200)
      .send(
        new ApiResponse(
          200,
          { user: updatedUser },
          "Phê duyệt nhân viên thành công"
        )
      );
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send(new ApiResponse(500, error, "Phê duyệt nhân viên thất bại"));
  }
};

export const completeProfile = async (req, res) => {
  try {
    const { userId } = req.user;
    const { email, additionalDetails } = req.body;

    if (!email) {
      return res
        .status(400)
        .send(new ApiResponse(400, null, "Email là bắt buộc"));
    }

    const user = await User.findById(userId);
    if (!user || !user.active) {
      return res
        .status(403)
        .send(new ApiResponse(403, null, "Tài khoản chưa được phê duyệt"));
    }

    user.email = email;
    user.additionalDetails = additionalDetails;

    await user.save();

    res
      .status(200)
      .send(new ApiResponse(200, { user }, "Hoàn thành hồ sơ thành công"));
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send(new ApiResponse(500, error, "Hoàn thành hồ sơ thất bại"));
  }
};
