import Category from "../models/category.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadImageToFirebase } from "../services/firebase.service.js";

export const createCategory = async (req, res) => {
  try {
    const { categoryName, description } = req.body;

    if (!categoryName) {
      return res
        .status(400)
        .send(new ApiResponse(400, null, "Category name is required"));
    }

    let imageUrl = null;

    if (req.file) {
      const fileBuffer = req.file.buffer;
      const fileName = req.file.originalname;
      imageUrl = await uploadImageToFirebase(fileBuffer, fileName, true);
    }

    const newCategory = new Category({
      categoryName,
      description,
      images: imageUrl,
    });

    await newCategory.save();

    res
      .status(201)
      .send(new ApiResponse(201, newCategory, "Category created successfully"));
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send(new ApiResponse(500, error, "Failed to create category"));
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryName, description } = req.body;

    if (!categoryName) {
      return res
        .status(400)
        .send(new ApiResponse(400, null, "Category name is required"));
    }

    let imageUrl = null;

    if (req.file) {
      const fileBuffer = req.file.buffer;
      const fileName = req.file.originalname;
      imageUrl = await uploadImageToFirebase(fileBuffer, fileName, true);
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      {
        categoryName,
        description,
        images: imageUrl || undefined, // Chỉ cập nhật hình ảnh nếu có file
      },
      { new: true }
    );

    if (!updatedCategory) {
      return res
        .status(404)
        .send(new ApiResponse(404, null, "Category not found"));
    }

    res
      .status(200)
      .send(
        new ApiResponse(200, updatedCategory, "Category updated successfully")
      );
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send(new ApiResponse(500, error, "Failed to update category"));
  }
};
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedCategory = await Category.findByIdAndDelete(id);

    if (!deletedCategory) {
      return res
        .status(404)
        .send(new ApiResponse(404, null, "Category not found"));
    }

    res
      .status(200)
      .send(
        new ApiResponse(200, deletedCategory, "Category deleted successfully")
      );
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send(new ApiResponse(500, error, "Failed to delete category"));
  }
};
export const getAllCategories = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const categories = await Category.find()
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const totalCategories = await Category.countDocuments();
    const totalPages = Math.ceil(totalCategories / limit);

    res.status(200).send(
      new ApiResponse(
        200,
        {
          categories,
          totalCategories,
          currentPage: parseInt(page),
          totalPages,
        },
        "Categories fetched successfully"
      )
    );
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send(new ApiResponse(500, error, "Failed to fetch categories"));
  }
};
