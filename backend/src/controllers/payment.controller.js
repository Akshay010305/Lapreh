const crypto = require("crypto");
const Razorpay = require("razorpay");

const Cart = require("../models/cart.model");
const Order = require("../models/order.model");
const Product = require("../models/product.model");

const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay credentials are not configured");
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

const reduceStock = (item) => {
  if (item.variantId) {
    return Product.findOneAndUpdate(
      {
        _id: item.product,
        stock: { $gte: item.quantity },
        "variants._id": item.variantId,
        "variants.stock": { $gte: item.quantity },
      },
      { $inc: { stock: -item.quantity, "variants.$.stock": -item.quantity } }
    );
  }
  return Product.findOneAndUpdate(
    { _id: item.product, stock: { $gte: item.quantity } },
    { $inc: { stock: -item.quantity } }
  );
};

const createPaymentOrder = async (req, res) => {
  const order = await Order.findOne({ _id: req.body.orderId, user: req.user._id });
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (order.paymentMethod !== "online") {
    return res.status(400).json({ message: "This order does not require online payment" });
  }
  if (order.isPaid) return res.status(400).json({ message: "Order is already paid" });

  if (!order.gatewayOrderId) {
    const gatewayOrder = await getRazorpay().orders.create({
      amount: Math.round(order.total * 100),
      currency: "INR",
      receipt: `lapreh_${order._id}`.slice(0, 40),
      notes: {
        appOrderId: order._id.toString(),
        customerId: req.user._id.toString(),
      },
    });
    order.gatewayOrderId = gatewayOrder.id;
    await order.save();
  }

  res.json({
    orderId: order._id,
    razorpayOrderId: order.gatewayOrderId,
    keyId: process.env.RAZORPAY_KEY_ID,
    amount: Math.round(order.total * 100),
    currency: "INR",
    name: "Lapreh Creations",
    description: `Order #${order._id.toString().slice(-8).toUpperCase()}`,
    prefill: {
      name: order.address.name,
      email: req.user.email,
      contact: order.address.phone,
    },
  });
};

const verifyPayment = async (req, res) => {
  const {
    orderId,
    razorpay_payment_id: paymentId,
    razorpay_order_id: razorpayOrderId,
    razorpay_signature: signature,
  } = req.body;
  const order = await Order.findOne({
    _id: orderId,
    user: req.user._id,
    paymentMethod: "online",
  });
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (order.isPaid) return res.json(order);
  if (!paymentId || !razorpayOrderId || !signature) {
    return res.status(400).json({ message: "Incomplete Razorpay payment response" });
  }
  if (order.gatewayOrderId !== razorpayOrderId) {
    return res.status(400).json({ message: "Razorpay order does not match" });
  }

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${order.gatewayOrderId}|${paymentId}`)
    .digest("hex");
  const provided = Buffer.from(signature, "hex");
  const expected = Buffer.from(expectedSignature, "hex");
  if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
    order.paymentStatus = "failed";
    await order.save();
    return res.status(400).json({ message: "Payment signature verification failed" });
  }

  const stockUpdates = await Promise.all(order.items.map(reduceStock));
  if (stockUpdates.some((product) => !product)) {
    return res.status(409).json({
      message: "Payment was verified, but stock changed. Please contact support with your payment ID.",
    });
  }

  order.isPaid = true;
  order.paidAt = new Date();
  order.paymentStatus = "paid";
  order.paymentReference = paymentId;
  order.status = "confirmed";
  order.statusHistory.push({
    status: "confirmed",
    note: "Payment verified and order confirmed",
    actor: "system",
    timestamp: new Date(),
  });
  await order.save();

  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
  res.json(order);
};

module.exports = { createPaymentOrder, verifyPayment };
