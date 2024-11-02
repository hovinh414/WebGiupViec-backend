import Service from "../models/service.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadImageToFirebase } from "../services/firebase.service.js";

// Create a new service
export const createService = async (req, res) => {
  try {
    const {
      serviceName,
      categoryId,
      shortDescription,
      fullDescription,
      basePrice,
      address,
      tasks,
    } = req.body;

    if (!serviceName || !categoryId || !basePrice) {
      return res
        .status(400)
        .send(new ApiResponse(400, null, "Required fields are missing"));
    }

    let imageUrls = [];
    if (req.files && req.files.length) {
      for (const file of req.files) {
        const imageUrl = await uploadImageToFirebase(
          file.buffer,
          file.originalname,
          true
        );
        imageUrls.push(imageUrl);
      }
    }

    const taskArray = tasks ? JSON.parse(tasks) : [];
    const populatedTasks = [];

    for (const task of taskArray) {
      const taskImageUrl = task.imageFile
        ? await uploadImageToFirebase(
            task.imageFile.buffer,
            task.imageFile.originalname,
            true
          )
        : null;

      populatedTasks.push({
        image: taskImageUrl,
        title: task.title,
        taskList: task.taskList || [],
      });
    }

    const newService = new Service({
      serviceName,
      categoryId,
      shortDescription,
      fullDescription,
      basePrice,
      images: imageUrls,
      address,
      tasks: populatedTasks,
    });

    await newService.save();
    res
      .status(201)
      .send(new ApiResponse(201, newService, "Service created successfully"));
  } catch (error) {
    console.error("Error in createService:", error); // Log lỗi chi tiết
    res
      .status(500)
      .send(new ApiResponse(500, error, "Failed to create service"));
  }
};

export const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      serviceName,
      categoryId,
      shortDescription,
      fullDescription,
      basePrice,
      address,
      tasks,
    } = req.body;

    if (!serviceName || !categoryId || !basePrice) {
      return res
        .status(400)
        .send(new ApiResponse(400, null, "Required fields are missing"));
    }

    // Tải lên hình ảnh mới nếu có
    let imageUrls = [];
    if (req.files && req.files.length) {
      for (const file of req.files) {
        const imageUrl = await uploadImageToFirebase(
          file.buffer,
          file.originalname,
          true
        );
        imageUrls.push(imageUrl);
      }
    }

    // Xử lý tasks
    const taskArray = tasks ? JSON.parse(tasks) : [];
    const populatedTasks = [];

    for (const task of taskArray) {
      let taskImageUrl = null;

      // Kiểm tra nếu task có imageFile tải lên hoặc sử dụng image URL cũ
      if (task.imageFile && task.imageFile.buffer) {
        taskImageUrl = await uploadImageToFirebase(
          task.imageFile.buffer,
          task.imageFile.originalname,
          true
        );
      } else if (task.image) {
        taskImageUrl = task.image; // Giữ URL ảnh hiện tại nếu không có thay đổi
      }

      populatedTasks.push({
        image: taskImageUrl,
        title: task.title,
        taskList: task.taskList || [],
      });
    }

    // Cập nhật service với các giá trị mới hoặc giữ nguyên nếu không thay đổi
    const updatedService = await Service.findByIdAndUpdate(
      id,
      {
        serviceName,
        categoryId,
        shortDescription,
        fullDescription,
        basePrice,
        images: imageUrls.length ? imageUrls : undefined, // Cập nhật nếu có ảnh mới
        address,
        tasks: populatedTasks,
      },
      { new: true }
    );

    if (!updatedService) {
      return res
        .status(404)
        .send(new ApiResponse(404, null, "Service not found"));
    }

    res
      .status(200)
      .send(
        new ApiResponse(200, updatedService, "Service updated successfully")
      );
  } catch (error) {
    console.error("Error in updateService:", error);
    res
      .status(500)
      .send(new ApiResponse(500, error, "Failed to update service"));
  }
};

// Delete a service
export const deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedService = await Service.findByIdAndDelete(id);

    if (!deletedService) {
      return res
        .status(404)
        .send(new ApiResponse(404, null, "Service not found"));
    }

    res
      .status(200)
      .send(
        new ApiResponse(200, deletedService, "Service deleted successfully")
      );
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send(new ApiResponse(500, error, "Failed to delete service"));
  }
};

// Get all services with pagination and optional categoryId filter
export const getAllServices = async (req, res) => {
  try {
    const { page = 1, limit = 10, categoryId, search = "" } = req.query;
    const filter = {
      ...((categoryId && { categoryId }) || {}),
      ...(search && {
        serviceName: { $regex: new RegExp(search, "i") }, // Tìm kiếm không phân biệt hoa/thường
      }),
    };

    const skip = (page - 1) * limit;

    const services = await Service.find(filter)
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .populate("categoryId", "categoryName description images");

    const totalServices = await Service.countDocuments(filter);
    const totalPages = Math.ceil(totalServices / limit);

    res.status(200).send(
      new ApiResponse(
        200,
        {
          services,
          totalServices,
          currentPage: parseInt(page),
          totalPages,
        },
        "Services fetched successfully"
      )
    );
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send(new ApiResponse(500, error, "Failed to fetch services"));
  }
};
