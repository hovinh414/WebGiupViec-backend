// workSchedule.routes.js
import express from "express";
import {
  createWorkSchedule,
  updateWorkSchedule,
  getWorkScheduleByUser,
  deleteWorkSchedule,
  getAllWorkSchedule,
} from "../controllers/workSchedule.controller.js";
import { checkAuth } from "../middlewares/auth.middleware.js";

const workScheduleRouter = express.Router();

// Định nghĩa các route cho WorkSchedule
workScheduleRouter.get("/", checkAuth, getAllWorkSchedule);
workScheduleRouter.post("/create-schedule", checkAuth, createWorkSchedule);
workScheduleRouter.put(
  "/update-schedule/:userId",
  checkAuth,
  updateWorkSchedule
);
workScheduleRouter.get(
  "/get-schedule/:userId",
  checkAuth,
  getWorkScheduleByUser
);
workScheduleRouter.delete(
  "/delete-schedule/:userId",
  checkAuth,
  deleteWorkSchedule
);

export default workScheduleRouter;
