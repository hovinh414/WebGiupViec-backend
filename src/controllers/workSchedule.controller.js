// workSchedule.controller.js
import WorkSchedule from "../models/workSchedule.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Lấy tất cả lịch làm việc và thông tin người dùng liên quan
export const getAllWorkSchedule = async (req, res) => {
  try {
    const workSchedules = await WorkSchedule.find().populate(
      "userId",
      "-password"
    );

    if (!workSchedules || workSchedules.length === 0) {
      return res
        .status(404)
        .send(new ApiResponse(404, null, "Không có lịch làm việc nào"));
    }

    res
      .status(200)
      .send(
        new ApiResponse(
          200,
          workSchedules,
          "Lấy danh sách tất cả lịch làm việc thành công"
        )
      );
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send(
        new ApiResponse(500, error, "Không thể lấy danh sách lịch làm việc")
      );
  }
};

// Tạo lịch làm việc cho người dùng
export const createWorkSchedule = async (req, res) => {
  try {
    const { userId, days } = req.body;

    if (!userId || !days) {
      return res
        .status(400)
        .send(
          new ApiResponse(400, null, "User ID và lịch làm việc là bắt buộc")
        );
    }

    const newSchedule = new WorkSchedule({
      userId,
      days,
    });

    await newSchedule.save();
    res
      .status(201)
      .send(
        new ApiResponse(
          201,
          newSchedule,
          "Lịch làm việc đã được tạo thành công"
        )
      );
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send(new ApiResponse(500, error, "Không thể tạo lịch làm việc"));
  }
};

// Cập nhật lịch làm việc cho người dùng
export const updateWorkSchedule = async (req, res) => {
  try {
    const { userId } = req.params;
    const { days } = req.body;

    if (!days) {
      return res
        .status(400)
        .send(new ApiResponse(400, null, "Lịch làm việc là bắt buộc"));
    }

    const updatedSchedule = await WorkSchedule.findOneAndUpdate(
      { userId },
      { days },
      { new: true }
    );

    if (!updatedSchedule) {
      return res
        .status(404)
        .send(new ApiResponse(404, null, "Không tìm thấy lịch làm việc"));
    }

    res
      .status(200)
      .send(
        new ApiResponse(200, updatedSchedule, "Lịch làm việc đã được cập nhật")
      );
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send(new ApiResponse(500, error, "Không thể cập nhật lịch làm việc"));
  }
};

// Lấy lịch làm việc theo userId
export const getWorkScheduleByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const workSchedule = await WorkSchedule.findOne({ userId });

    if (!workSchedule) {
      return res
        .status(404)
        .send(new ApiResponse(404, null, "Không tìm thấy lịch làm việc"));
    }

    res
      .status(200)
      .send(new ApiResponse(200, workSchedule, "Lấy lịch làm việc thành công"));
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send(new ApiResponse(500, error, "Không thể lấy lịch làm việc"));
  }
};

// Xóa lịch làm việc theo userId
export const deleteWorkSchedule = async (req, res) => {
  try {
    const { userId } = req.params;

    const deletedSchedule = await WorkSchedule.findOneAndDelete({ userId });

    if (!deletedSchedule) {
      return res
        .status(404)
        .send(
          new ApiResponse(404, null, "Không tìm thấy lịch làm việc để xóa")
        );
    }

    res
      .status(200)
      .send(
        new ApiResponse(200, deletedSchedule, "Xóa lịch làm việc thành công")
      );
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send(new ApiResponse(500, error, "Không thể xóa lịch làm việc"));
  }
};
