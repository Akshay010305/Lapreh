const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        name: { type: String, required: true },
        image: String,
        originalImage: String,
        variantId: String,
        variantName: String,
        sku: String,
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    address: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
    },
    subtotal: { type: Number, required: true },
    shipping: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["cod", "online"], default: "cod" },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refund_pending", "refunded"],
      default: "pending",
    },
    paymentReference: String,
    gatewayOrderId: String,
    refundId: String,
    refundStatus: {
      type: String,
      enum: ["not_required", "pending", "processed", "failed"],
      default: "not_required",
    },
    refundedAt: Date,
    returnStatus: {
      type: String,
      enum: ["not_requested", "requested", "approved", "rejected"],
      default: "not_requested",
    },
    returnReason: String,
    returnRequestedAt: Date,
    returnResolvedAt: Date,
    returnResolutionNote: String,
    invoiceNumber: String,
    invoiceIssuedAt: Date,
    tracking: {
      courier: String,
      trackingNumber: String,
      trackingUrl: String,
      shippedAt: Date,
      estimatedDelivery: Date,
      deliveredAt: Date,
    },
    isPaid: { type: Boolean, default: false },
    paidAt: Date,
    status: {
      type: String,
      enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"],
          required: true,
        },
        note: String,
        actor: { type: String, enum: ["system", "customer", "admin"], default: "system" },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    cancellationReason: String,
    cancelledAt: Date,
    cancelledBy: { type: String, enum: ["customer", "admin"] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
