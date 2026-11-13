const Cart = require("../models/cart.model");
const Order = require("../models/order.model");
const Product = require("../models/product.model");
const Razorpay = require("razorpay");

const requiredAddressFields = ["name", "phone", "street", "city", "state", "pincode"];
const cancellableStatuses = new Set(["pending", "confirmed", "processing"]);
const allowedTransitions = {
  pending: ["confirmed"],
  confirmed: ["processing"],
  processing: ["shipped"],
  shipped: ["delivered"],
};

const getVariant = (product, variantId) => {
  if (!variantId) return null;
  return product.variants?.id?.(variantId) || product.variants?.find(
    (variant) => variant._id.toString() === variantId.toString()
  );
};

const buildInvoiceNumber = (order) =>
  `LAP-${new Date(order.createdAt || Date.now()).getFullYear()}-${order._id
    .toString()
    .slice(-6)
    .toUpperCase()}`;

const getRazorpay = () =>
  new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

const restoreOrderStock = async (order) => {
  if (order.status === "pending" && !order.isPaid) return;
  await Promise.all(order.items.map(async (item) => {
    if (item.variantId) {
      return Product.updateOne(
        { _id: item.product, "variants._id": item.variantId },
        { $inc: { "variants.$.stock": item.quantity, stock: item.quantity } }
      );
    }
    return Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
  }));
};

const cancelOrderRecord = async (order, reason, actor) => {
  if (!cancellableStatuses.includes(order.status)) {
    const error = new Error("This order can no longer be cancelled");
    error.statusCode = 400;
    throw error;
  }

  if (order.isPaid && order.paymentReference) {
    try {
      const refund = await getRazorpay().payments.refund(order.paymentReference, {
        amount: Math.round(order.total * 100),
        speed: "normal",
        notes: {
          appOrderId: order._id.toString(),
          cancellationReason: reason,
        },
      });
      order.refundId = refund.id;
      order.refundStatus = refund.status === "processed" ? "processed" : "pending";
      order.paymentStatus = refund.status === "processed" ? "refunded" : "refund_pending";
      if (refund.status === "processed") order.refundedAt = new Date();
    } catch (refundError) {
      order.refundStatus = "failed";
      await order.save();
      const error = new Error(
        refundError.error?.description ||
          "The refund could not be initiated. Please contact support before cancelling."
      );
      error.statusCode = 502;
      throw error;
    }
  }

  await restoreOrderStock(order);
  order.status = "cancelled";
  order.cancellationReason = reason;
  order.cancelledAt = new Date();
  order.cancelledBy = actor;
  order.statusHistory.push({
    status: "cancelled",
    note: reason,
    actor,
    timestamp: new Date(),
  });
  await order.save();
  return order;
};

const createOrder = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
  if (!cart || cart.items.length === 0) return res.status(400).json({ message: "Cart is empty" });

  const address = req.body.address || {};
  const missingField = requiredAddressFields.find((field) => !String(address[field] || "").trim());
  if (missingField) {
    return res.status(400).json({ message: `Delivery address ${missingField} is required` });
  }

  const paymentMethod = req.body.paymentMethod === "online" ? "online" : "cod";
  for (const item of cart.items) {
    const variant = item.product ? getVariant(item.product, item.variantId) : null;
    const availableStock = variant ? variant.stock : item.product?.stock;
    if (!item.product || availableStock < item.quantity) {
      return res.status(400).json({
        message: `${item.product?.name || "A cart item"} is no longer available in the requested quantity`,
      });
    }
  }

  const items = cart.items.map((item) => ({
    product: item.product._id,
    name: item.product.name,
    image: item.product.image,
    originalImage: item.product.images?.[0] || item.product.image,
    variantId: item.variantId,
    variantName: item.variantName,
    sku: getVariant(item.product, item.variantId)?.sku,
    price: getVariant(item.product, item.variantId)?.price || item.product.price,
    quantity: item.quantity,
  }));
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal >= 2000 ? 0 : 149;
  const total = subtotal + shipping;
  const order = await Order.create({
    user: req.user._id,
    items,
    address,
    subtotal,
    shipping,
    total,
    paymentMethod,
    paymentStatus: "pending",
    status: paymentMethod === "cod" ? "confirmed" : "pending",
    statusHistory: [
      {
        status: paymentMethod === "cod" ? "confirmed" : "pending",
        note: paymentMethod === "cod" ? "Order confirmed for cash on delivery" : "Awaiting online payment",
        actor: "system",
      },
    ],
  });
  order.invoiceNumber = buildInvoiceNumber(order);
  order.invoiceIssuedAt = new Date();
  await order.save();

  if (paymentMethod === "cod") {
    const stockUpdates = await Promise.all(
      items.map((item) => {
        if (item.variantId) {
          return Product.findOneAndUpdate(
            { _id: item.product, stock: { $gte: item.quantity }, "variants._id": item.variantId, "variants.stock": { $gte: item.quantity } },
            { $inc: { stock: -item.quantity, "variants.$.stock": -item.quantity } }
          );
        }
        return Product.findOneAndUpdate(
          { _id: item.product, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } }
        );
      })
    );
    if (stockUpdates.some((product) => !product)) {
      await Order.findByIdAndDelete(order._id);
      return res.status(409).json({ message: "Stock changed during checkout. Please review your cart." });
    }

    cart.items = [];
    await cart.save();
  }

  res.status(201).json(order);
};

const getMyOrders = async (req, res) => {
  res.json(await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).populate('items.product'));
};

const getAllOrders = async (req, res) => {
  res.json(await Order.find().populate('items.product').populate("user", "name email"));
};

const getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id).populate('items.product');
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (!req.user.isAdmin && order.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "You cannot view this order" });
  }
  res.json(order);
};

const cancelMyOrder = async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) return res.status(404).json({ message: "Order not found" });

  const reason = String(req.body.reason || "").trim();
  if (reason.length < 3) {
    return res.status(400).json({ message: "Please provide a cancellation reason" });
  }

  res.json(await cancelOrderRecord(order, reason, "customer"));
};

const getDeliveredAt = (order) => {
  if (order.tracking?.deliveredAt) return new Date(order.tracking.deliveredAt);
  const deliveredEvent = (order.statusHistory || []).find((event) => event.status === "delivered");
  return deliveredEvent ? new Date(deliveredEvent.timestamp) : null;
};

const requestOrderReturn = async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (order.status !== "delivered") {
    return res.status(400).json({ message: "Return requests can only be made after delivery." });
  }
  if (order.returnStatus !== "not_requested") {
    return res.status(400).json({ message: "A return request has already been submitted." });
  }

  const reason = String(req.body.reason || "").trim();
  if (reason.length < 5) {
    return res.status(400).json({ message: "Please provide a valid return reason." });
  }

  const deliveredAt = getDeliveredAt(order);
  if (deliveredAt) {
    const returnWindowDays = 14;
    const msSinceDelivery = Date.now() - deliveredAt.getTime();
    if (msSinceDelivery > returnWindowDays * 24 * 60 * 60 * 1000) {
      return res.status(400).json({ message: `The return window of ${returnWindowDays} days has expired.` });
    }
  }

  order.returnStatus = "requested";
  order.returnReason = reason;
  order.returnRequestedAt = new Date();
  order.returnResolutionNote = undefined;
  order.returnResolvedAt = undefined;
  order.statusHistory.push({
    status: order.status,
    note: `Return requested: ${reason}`,
    actor: "customer",
    timestamp: new Date(),
  });
  await order.save();
  res.json(order);
};

const resolveReturnRequest = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (order.returnStatus !== "requested") {
    return res.status(400).json({ message: "There is no return request to resolve." });
  }

  const action = String(req.body.action || "").trim().toLowerCase();
  if (!["approved", "rejected"].includes(action)) {
    return res.status(400).json({ message: "Invalid return action." });
  }

  const note = String(req.body.note || "").trim();
  order.returnStatus = action;
  order.returnResolvedAt = new Date();
  order.returnResolutionNote = note || undefined;

  if (action === "approved" && order.paymentMethod === "online" && order.paymentReference) {
    try {
      const refund = await getRazorpay().payments.refund(order.paymentReference, {
        amount: Math.round(order.total * 100),
        speed: "normal",
        notes: {
          appOrderId: order._id.toString(),
          returnRequestId: order._id.toString(),
          returnReason: order.returnReason,
        },
      });
      order.refundId = refund.id;
      order.refundStatus = refund.status === "processed" ? "processed" : "pending";
      order.paymentStatus = refund.status === "processed" ? "refunded" : "refund_pending";
      if (refund.status === "processed") order.refundedAt = new Date();
    } catch (refundError) {
      order.refundStatus = "failed";
      await order.save();
      const error = new Error(
        refundError.error?.description ||
          "The return refund could not be initiated. Please contact support."
      );
      error.statusCode = 502;
      throw error;
    }
  }

  order.statusHistory.push({
    status: order.status,
    note: note ? `Return ${action}: ${note}` : `Return ${action}`,
    actor: "admin",
    timestamp: new Date(),
  });
  await order.save();
  res.json(order);
};

const updateOrderStatus = async (req, res) => {
  const allowedStatuses = ["confirmed", "processing", "shipped", "delivered", "cancelled"];
  if (!allowedStatuses.includes(req.body.status)) {
    return res.status(400).json({ message: "Invalid order status" });
  }
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (req.body.status === "cancelled") {
    return res.json(
      await cancelOrderRecord(
        order,
        String(req.body.reason || "Cancelled by administrator"),
        "admin"
      )
    );
  }
  if (["cancelled", "delivered"].includes(order.status)) {
    return res.status(400).json({ message: "This order status is final" });
  }
  if (!allowedTransitions[order.status]?.includes(req.body.status)) {
    return res.status(400).json({
      message: `Order cannot move from ${order.status} to ${req.body.status}`,
    });
  }

  order.status = req.body.status;
  if (req.body.status === "shipped") {
    order.tracking = {
      ...order.tracking?.toObject?.(),
      ...order.tracking,
      ...req.body.tracking,
      shippedAt: order.tracking?.shippedAt || new Date(),
    };
  }
  if (req.body.status === "delivered") {
    order.tracking = {
      ...order.tracking?.toObject?.(),
      ...order.tracking,
      deliveredAt: new Date(),
    };
  }
  order.statusHistory.push({
    status: req.body.status,
    note: `Order marked ${req.body.status}`,
    actor: "admin",
    timestamp: new Date(),
  });
  await order.save();
  res.json(order);
};

const getOrderInvoice = async (req, res) => {
  const order = await Order.findById(req.params.id).populate("user", "name email");
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (!req.user.isAdmin && order.user._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "You cannot view this invoice" });
  }
  if (!order.invoiceNumber) {
    order.invoiceNumber = buildInvoiceNumber(order);
    order.invoiceIssuedAt = new Date();
    await order.save();
  }
  res.json({
    invoiceNumber: order.invoiceNumber,
    invoiceIssuedAt: order.invoiceIssuedAt,
    brand: "Lapreh Creations",
    order,
  });
};

const updateOrderTracking = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  const tracking = req.body.tracking || req.body;
  order.tracking = {
    courier: String(tracking.courier || "").trim(),
    trackingNumber: String(tracking.trackingNumber || "").trim(),
    trackingUrl: String(tracking.trackingUrl || "").trim(),
    estimatedDelivery: tracking.estimatedDelivery ? new Date(tracking.estimatedDelivery) : undefined,
    shippedAt: tracking.shippedAt ? new Date(tracking.shippedAt) : order.tracking?.shippedAt,
    deliveredAt: order.tracking?.deliveredAt,
  };
  await order.save();
  res.json(order);
};

module.exports = {
  cancelMyOrder,
  createOrder,
  getAllOrders,
  getMyOrders,
  getOrderById,
  getOrderInvoice,
  requestOrderReturn,
  resolveReturnRequest,
  updateOrderStatus,
  updateOrderTracking,
};
