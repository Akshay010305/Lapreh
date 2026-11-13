const Order = require("../models/order.model");
const Product = require("../models/product.model");
const User = require("../models/user.model");

const getDashboardStats = async (req, res) => {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 5, 1);
  startDate.setHours(0, 0, 0, 0);

  const [users, products, orders, revenueData, statusData, monthlyData, recentOrders, lowStock] =
    await Promise.all([
    User.countDocuments({ isAdmin: false }),
    Product.countDocuments(),
    Order.countDocuments(),
    Order.aggregate([
      {
        $match: {
          status: { $ne: "cancelled" },
          $or: [{ isPaid: true }, { paymentMethod: "cod" }],
        },
      },
      { $group: { _id: null, revenue: { $sum: "$total" }, averageOrder: { $avg: "$total" } } },
    ]),
    Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, status: { $ne: "cancelled" } } },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
    Order.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .populate("user", "name email")
      .populate("items.product"),
    Product.find({ stock: { $lte: 10 } })
      .sort({ stock: 1 })
      .limit(8)
      .populate("category"),
  ]);

  const monthFormatter = new Intl.DateTimeFormat("en-IN", { month: "short" });
  res.json({
    users,
    products,
    orders,
    revenue: revenueData[0]?.revenue || 0,
    averageOrder: Math.round(revenueData[0]?.averageOrder || 0),
    statusBreakdown: statusData.map((item) => ({ status: item._id, count: item.count })),
    monthlySales: monthlyData.map((item) => ({
      month: monthFormatter.format(new Date(item._id.year, item._id.month - 1, 1)),
      revenue: item.revenue,
      orders: item.orders,
    })),
    recentOrders,
    lowStock,
  });
};

module.exports = { getDashboardStats };
