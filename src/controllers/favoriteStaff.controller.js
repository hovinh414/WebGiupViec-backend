import FavoriteStaff from "../models/favoriteStaff.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Add a staff member to a customer's favorites
export const addFavoriteStaff = async (req, res) => {
  try {
    const { customerId, staffId } = req.body;

    if (!customerId || !staffId) {
      return res
        .status(400)
        .send(
          new ApiResponse(400, null, "Customer ID and Staff ID are required")
        );
    }

    const favorite = new FavoriteStaff({ customerId, staffId });

    await favorite.save();

    res
      .status(201)
      .send(
        new ApiResponse(201, favorite, "Favorite staff added successfully")
      );
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send(new ApiResponse(500, error, "Failed to add favorite staff"));
  }
};

// Remove a staff member from a customer's favorites
export const removeFavoriteStaff = async (req, res) => {
  try {
    const { customerId, staffId } = req.params;
    console.log(staffId);
    const deletedFavorite = await FavoriteStaff.findOneAndDelete({
      customerId,
      staffId,
    });

    if (!deletedFavorite) {
      return res
        .status(404)
        .send(new ApiResponse(404, null, "Favorite staff not found"));
    }

    res
      .status(200)
      .send(
        new ApiResponse(
          200,
          deletedFavorite,
          "Favorite staff removed successfully"
        )
      );
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send(new ApiResponse(500, error, "Failed to remove favorite staff"));
  }
};

// Get all favorite staff for a specific customer
export const getFavoriteStaffByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const favoriteStaffList = await FavoriteStaff.find({ customerId })
      .populate("staffId", "name email phone address role avatar")
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const totalFavorites = await FavoriteStaff.countDocuments({ customerId });
    const totalPages = Math.ceil(totalFavorites / limit);

    res.status(200).send(
      new ApiResponse(
        200,
        {
          favoriteStaffList,
          totalFavorites,
          currentPage: parseInt(page),
          totalPages,
        },
        "Favorite staff fetched successfully"
      )
    );
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send(new ApiResponse(500, error, "Failed to fetch favorite staff"));
  }
};
