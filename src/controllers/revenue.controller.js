import mongoose from "mongoose";
import Booking from "../models/booking.model.js";
import User from "../models/user.model.js";
import Service from "../models/service.model.js";
import moment from "moment";

export const getAdminRevenue = async (req, res) => {
  try {
    // Lấy số lượng khách hàng, nhân viên, đặt lịch và dịch vụ
    const customerCount = await User.countDocuments({ role: "customer" });
    const staffCount = await User.countDocuments({ role: "staff" });
    const totalBooking = await Booking.countDocuments();
    const totalService = await Service.countDocuments();

    // Helper để tính toán doanh thu
    const calculateRevenue = async (start, end) => {
      const bookings = await Booking.find({
        status: "completed",
        bookingDate: { $gte: start, $lt: end },
      });

      let totalRevenue = 0;
      let totalDiscountRevenue = 0;

      bookings.forEach((booking) => {
        const actualAmount = booking.actualAmountReceived || 0;
        const staffDiscount = booking.staffDiscount || 0; // Lấy discount từ nhân viên
        const discountAmount = actualAmount * (staffDiscount / 100);
        totalRevenue += actualAmount;
        totalDiscountRevenue += discountAmount;
      });

      return { totalRevenue, totalDiscountRevenue };
    };

    // Doanh thu hôm nay và hôm qua
    const today = moment().startOf("day");
    const yesterday = moment(today).subtract(1, "day");
    const { totalRevenue: revenueToday, totalDiscountRevenue: discountToday } =
      await calculateRevenue(
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

    // Doanh thu tháng này và tháng trước
    const startOfMonth = moment().startOf("month");
    const startOfLastMonth = moment(startOfMonth).subtract(1, "month");
    const {
      totalRevenue: revenueThisMonth,
      totalDiscountRevenue: discountThisMonth,
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

    // Doanh thu năm nay và năm ngoái
    const startOfYear = moment().startOf("year");
    const startOfLastYear = moment(startOfYear).subtract(1, "year");
    const {
      totalRevenue: revenueThisYear,
      totalDiscountRevenue: discountThisYear,
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

    // Doanh thu theo ngày từ ngày tới ngày (sử dụng cho biểu đồ)
    let customRevenue = [];
    if (req.query.startDate && req.query.endDate) {
      const start = moment(req.query.startDate).startOf("day");
      const end = moment(req.query.endDate).endOf("day");

      const bookings = await Booking.find({
        status: "completed",
        bookingDate: { $gte: start.toDate(), $lte: end.toDate() },
      });

      // Tính doanh thu theo ngày
      const revenueByDate = {};
      bookings.forEach((booking) => {
        const date = moment(booking.bookingDate).format("DD-MM-YYYY");
        const actualAmount = booking.actualAmountReceived || 0;
        const discount = booking.staffDiscount || 0; // Tỷ lệ discount từ nhân viên
        const revenueAfterDiscount = actualAmount * (1 - discount / 100);

        if (!revenueByDate[date]) {
          revenueByDate[date] = 0;
        }
        revenueByDate[date] += revenueAfterDiscount;
      });

      // Chuyển đổi thành mảng với format {_id: ngày, totalRevenue: doanh thu}
      customRevenue = Object.keys(revenueByDate).map((date) => ({
        _id: date,
        totalRevenue: revenueByDate[date],
      }));
    }

    res.json({
      customerCount,
      staffCount,
      totalBooking,
      totalService,
      revenueToday,
      revenueYesterday,
      todayGrowth,
      revenueThisMonth,
      revenueLastMonth,
      monthGrowth,
      revenueThisYear,
      revenueLastYear,
      yearGrowth,
      discountToday,
      discountThisMonth,
      discountThisYear,
      customRevenue,
    });
  } catch (error) {
    console.error("Error calculating revenue for admin:", error);
    res.status(500).json({ message: "Lỗi khi tính toán doanh thu." });
  }
};
