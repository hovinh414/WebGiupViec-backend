import express from "express";
import { getAdminRevenue } from "../controllers/revenue.controller.js"; // Import controller

const adminRevenueRouter = express.Router();

// Route lấy doanh thu tổng quan cho admin
adminRevenueRouter.get("/", getAdminRevenue);

export default adminRevenueRouter;
