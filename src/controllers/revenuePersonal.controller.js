import mongoose from "mongoose";
import Booking from "../models/booking.model.js";
import User from "../models/user.model.js";
import moment from "moment";

export const getRevenue = async (req, res) => {
  try {
    const { staffId, startDate, endDate } = req.query;

    // Check if the staffId is valid
    if (!mongoose.Types.ObjectId.isValid(staffId)) {
      return res.status(400).json({ message: "ID nhân viên không hợp lệ." });
    }

    const staff = await User.findById(staffId);
    if (!staff) {
      return res.status(404).json({ message: "Nhân viên không tồn tại." });
    }

    // Helper function to calculate revenue
    const calculateRevenue = async (start, end) => {
      const bookings = await Booking.find({
        preferredStaffId: new mongoose.Types.ObjectId(staffId),
        status: "completed",
        bookingDate: { $gte: start, $lt: end },
      });

      let totalRevenue = 0;
      let totalBeforeDiscount = 0;

      bookings.forEach((booking) => {
        const actualAmount = booking.actualAmountReceived || 0;
        const staffDiscount = booking.staffDiscount || 0;
        const revenueAfterDiscount = actualAmount * (1 - staffDiscount / 100);

        totalRevenue += revenueAfterDiscount;
        totalBeforeDiscount += actualAmount;
      });

      return { totalRevenue, totalBeforeDiscount };
    };

    // Calculate today's and yesterday's revenue
    const today = moment().startOf("day");
    const yesterday = moment(today).subtract(1, "day");
    const {
      totalRevenue: revenueToday,
      totalBeforeDiscount: beforeDiscountToday,
    } = await calculateRevenue(
      today.toDate(),
      moment(today).endOf("day").toDate()
    );
    const { totalRevenue: revenueYesterday } = await calculateRevenue(
      yesterday.toDate(),
      moment(yesterday).endOf("day").toDate()
    );

    const todayGrowth = revenueYesterday
      ? ((revenueToday - revenueYesterday) / revenueYesterday) * 100
      : null;

    // Calculate this month and last month's revenue
    const startOfMonth = moment().startOf("month");
    const startOfLastMonth = moment(startOfMonth).subtract(1, "month");
    const {
      totalRevenue: revenueThisMonth,
      totalBeforeDiscount: beforeDiscountMonth,
    } = await calculateRevenue(
      startOfMonth.toDate(),
      moment().endOf("month").toDate()
    );
    const { totalRevenue: revenueLastMonth } = await calculateRevenue(
      startOfLastMonth.toDate(),
      moment(startOfMonth).subtract(1, "day").endOf("day").toDate()
    );

    const monthGrowth = revenueLastMonth
      ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
      : null;

    // Calculate this year and last year's revenue
    const startOfYear = moment().startOf("year");
    const startOfLastYear = moment(startOfYear).subtract(1, "year");
    const {
      totalRevenue: revenueThisYear,
      totalBeforeDiscount: beforeDiscountYear,
    } = await calculateRevenue(
      startOfYear.toDate(),
      moment().endOf("year").toDate()
    );
    const { totalRevenue: revenueLastYear } = await calculateRevenue(
      startOfLastYear.toDate(),
      moment(startOfYear).subtract(1, "day").endOf("day").toDate()
    );

    const yearGrowth = revenueLastYear
      ? ((revenueThisYear - revenueLastYear) / revenueLastYear) * 100
      : null;

    // Calculate custom revenue between startDate and endDate
    let customRevenue = [];
    if (startDate && endDate) {
      const start = moment(startDate).startOf("day");
      const end = moment(endDate).endOf("day");

      const bookings = await Booking.find({
        preferredStaffId: new mongoose.Types.ObjectId(staffId),
        status: "completed",
        bookingDate: { $gte: start.toDate(), $lte: end.toDate() },
      });

      const revenueByDate = {};

      bookings.forEach((booking) => {
        const dateKey = moment(booking.bookingDate).format("DD-MM-YYYY");
        const actualAmount = booking.actualAmountReceived || 0;
        const staffDiscount = booking.staffDiscount || 0;
        const revenueAfterDiscount = actualAmount * (1 - staffDiscount / 100);

        if (!revenueByDate[dateKey]) {
          revenueByDate[dateKey] = 0;
        }
        revenueByDate[dateKey] += revenueAfterDiscount;
      });

      customRevenue = Object.keys(revenueByDate).map((date) => ({
        _id: date,
        totalRevenue: revenueByDate[date],
      }));
    }

    res.json({
      revenueToday,
      revenueYesterday,
      todayGrowth,
      revenueThisMonth,
      revenueLastMonth,
      monthGrowth,
      revenueThisYear,
      revenueLastYear,
      yearGrowth,
      beforeDiscountToday,
      beforeDiscountMonth,
      beforeDiscountYear,
      customRevenue,
    });
  } catch (error) {
    console.error("Error calculating revenue:", error);
    res.status(500).json({ message: "Lỗi khi tính toán doanh thu." });
  }
};
