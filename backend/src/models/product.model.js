const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    productId: String,
    productCode: { type: String, unique: true, sparse: true },
    description: String,
    price: { type: Number, required: true },
    originalPrice: Number,
    discount: { type: Number, default: 0 },
    imageCount: { type: Number, default: 0 },
    sortOrder: { type: Number, default: 0 },
    images: [{ type: String }],
    videos: [{ type: String }],
    image: String,
    video: String,
    stock: { type: Number, default: 0 },
    variants: [
      {
        name: { type: String, required: true },
        sku: String,
        size: String,
        color: String,
        fabric: String,
        price: Number,
        stock: { type: Number, default: 0 },
      },
    ],
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
