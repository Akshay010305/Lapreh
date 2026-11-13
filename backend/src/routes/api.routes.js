const express = require("express");

const { getDashboardStats } = require("../controllers/admin.controller");
const {
  getMe,
  login,
  logout,
  register,
  resendVerificationCode,
  verifyEmail,
} = require("../controllers/auth.controller");
const {
  addToCart,
  clearCart,
  getCart,
  removeCartItem,
  updateCartItem,
} = require("../controllers/cart.controller");
const {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} = require("../controllers/category.controller");
const {
  cancelMyOrder,
  createOrder,
  getAllOrders,
  getMyOrders,
  getOrderInvoice,
  getOrderById,
  requestOrderReturn,
  resolveReturnRequest,
  updateOrderStatus,
  updateOrderTracking,
} = require("../controllers/order.controller");
const {
  createPaymentOrder,
  verifyPayment,
} = require("../controllers/payment.controller");
const {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  updateProduct,
} = require("../controllers/product.controller");
const { uploadProductImage } = require("../controllers/upload.controller");
const {
  addAddress,
  deleteAddress,
  getProfile,
  setDefaultAddress,
  updateAddress,
  updateProfile,
} = require("../controllers/user.controller");
const {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
} = require("../controllers/wishlist.controller");
const { adminOnly, customerOnly, protect } = require("../middleware/auth.middleware");
const { authRateLimiter } = require("../middleware/rateLimit.middleware");
const asyncRoute = require("../utils/asyncRoute");

const router = express.Router();

router.post("/auth/register", authRateLimiter, asyncRoute(register));
router.post("/auth/login", authRateLimiter, asyncRoute(login));
router.post("/auth/verify", authRateLimiter, asyncRoute(verifyEmail));
router.post("/auth/resend-verification", authRateLimiter, asyncRoute(resendVerificationCode));
router.post("/auth/logout", logout);
router.get("/auth/me", protect, getMe);

router.get("/users/profile", protect, getProfile);
router.put("/users/profile", protect, asyncRoute(updateProfile));
router.post("/users/addresses", protect, asyncRoute(addAddress));
router.put("/users/addresses/:addressId", protect, asyncRoute(updateAddress));
router.put("/users/addresses/:addressId/default", protect, asyncRoute(setDefaultAddress));
router.delete("/users/addresses/:addressId", protect, asyncRoute(deleteAddress));

router.get("/wishlist", protect, customerOnly, asyncRoute(getWishlist));
router.post("/wishlist/:productId", protect, customerOnly, asyncRoute(addToWishlist));
router.delete("/wishlist/:productId", protect, customerOnly, asyncRoute(removeFromWishlist));

router.get("/products", asyncRoute(getProducts));
router.get("/products/:id", asyncRoute(getProductById));
router.post("/products", protect, adminOnly, asyncRoute(createProduct));
router.put("/products/:id", protect, adminOnly, asyncRoute(updateProduct));
router.delete("/products/:id", protect, adminOnly, asyncRoute(deleteProduct));

router.get("/categories", asyncRoute(getCategories));
router.post("/categories", protect, adminOnly, asyncRoute(createCategory));
router.put("/categories/:id", protect, adminOnly, asyncRoute(updateCategory));
router.delete("/categories/:id", protect, adminOnly, asyncRoute(deleteCategory));

router.get("/cart", protect, customerOnly, asyncRoute(getCart));
router.post("/cart/add", protect, customerOnly, asyncRoute(addToCart));
router.put("/cart/update/:itemId", protect, customerOnly, asyncRoute(updateCartItem));
router.delete("/cart/remove/:itemId", protect, customerOnly, asyncRoute(removeCartItem));
router.delete("/cart/clear", protect, customerOnly, asyncRoute(clearCart));

router.post("/orders", protect, customerOnly, asyncRoute(createOrder));
router.get("/orders/my-orders", protect, customerOnly, asyncRoute(getMyOrders));
router.get("/orders", protect, adminOnly, asyncRoute(getAllOrders));
router.get("/orders/:id", protect, asyncRoute(getOrderById));
router.get("/orders/:id/invoice", protect, asyncRoute(getOrderInvoice));
router.post("/orders/:id/cancel", protect, customerOnly, asyncRoute(cancelMyOrder));
router.post("/orders/:id/return-request", protect, customerOnly, asyncRoute(requestOrderReturn));
router.put("/orders/:id/return", protect, adminOnly, asyncRoute(resolveReturnRequest));
router.put("/orders/:id/status", protect, adminOnly, asyncRoute(updateOrderStatus));
router.put("/orders/:id/tracking", protect, adminOnly, asyncRoute(updateOrderTracking));

router.post("/payments/create-order", protect, customerOnly, asyncRoute(createPaymentOrder));
router.post("/payments/verify", protect, customerOnly, asyncRoute(verifyPayment));

router.get("/admin/dashboard", protect, adminOnly, asyncRoute(getDashboardStats));

router.post("/uploads/product-image", protect, adminOnly, uploadProductImage);

module.exports = router;
