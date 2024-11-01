import express from "express";
import { getRevenue } from "../controllers/revenuePersonal.controller.js";
import { checkAuth } from "../middlewares/auth.middleware.js";

const personalRevenueRouter = express.Router();

// Route lấy doanh thu cá nhân với xác thực
personalRevenueRouter.get("/", checkAuth, getRevenue);

export { personalRevenueRouter };
