import express from "express";
import { categoryRouter } from "./category.route.js";
import { serviceRouter } from "./service.route.js";
import { authRouter } from "./auth.route.js";
import { userRouter } from "./user.route.js";
import { bookingRouter } from "./booking.route.js";
import { feedbackRouter } from "./feedback.route.js";
import workScheduleRouter from "./workSchedule.route.js";
import { favoriteStaffRouter } from "./favoriteStaff.route.js";
import { personalRevenueRouter } from "./personalRevenue.route.js";
import adminRevenueRouter from "./revenue.route.js";

const indexRouter = express.Router();
indexRouter.use("/api/v1/category", categoryRouter);
indexRouter.use("/api/v1/service", serviceRouter);
indexRouter.use("/api/v1/auth", authRouter);
indexRouter.use("/api/v1/user", userRouter);
indexRouter.use("/api/v1/booking", bookingRouter);
indexRouter.use("/api/v1/feedback", feedbackRouter);
indexRouter.use("/api/v1/work-schedule", workScheduleRouter);
indexRouter.use("/api/v1/favorite-staff", favoriteStaffRouter);
indexRouter.use("/api/v1/personal-revenue", personalRevenueRouter);
indexRouter.use("/api/v1/revenue", adminRevenueRouter);

export { indexRouter };
