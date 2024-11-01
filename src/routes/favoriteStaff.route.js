import express from "express";
import {
  addFavoriteStaff,
  removeFavoriteStaff,
  getFavoriteStaffByCustomer,
} from "../controllers/favoriteStaff.controller.js"; // Use one controller
import { checkAuth } from "../middlewares/auth.middleware.js"; // Optional if auth is required

const favoriteStaffRouter = express.Router();

// Route to get all favorite staff for a specific customer
favoriteStaffRouter
  .route("/:customerId")
  .get(checkAuth, getFavoriteStaffByCustomer);

// Route to add a staff member to a customer's favorites
favoriteStaffRouter.route("/").post(checkAuth, addFavoriteStaff);

// Route to remove a staff member from a customer's favorites
favoriteStaffRouter
  .route("/:customerId/:staffId")
  .delete(checkAuth, removeFavoriteStaff);

export { favoriteStaffRouter };
