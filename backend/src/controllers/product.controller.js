const Product = require("../models/product.model");

const normalizeProductPayload = (body) => {
  const payload = { ...body };

  const toStringArray = (value) => {
    if (Array.isArray(value)) {
      return value.map((item) => String(item || "").trim()).filter(Boolean);
    }
    if (typeof value === "string" && value.trim()) {
      return [value.trim()];
    }
    return [];
  };

  if (payload.images !== undefined) {
    payload.images = toStringArray(payload.images);
  }

  if (payload.videos !== undefined) {
    payload.videos = toStringArray(payload.videos);
  }

  if (Array.isArray(payload.variants)) {
    payload.variants = payload.variants
      .map((variant) => ({
        name: String(variant.name || "").trim(),
        sku: String(variant.sku || "").trim(),
        size: String(variant.size || "").trim(),
        color: String(variant.color || "").trim(),
        fabric: String(variant.fabric || "").trim(),
        price: variant.price === "" || variant.price == null ? undefined : Number(variant.price),
        stock: Number(variant.stock) || 0,
      }))
      .filter((variant) => variant.name);
    if (payload.variants.length > 0) {
      payload.stock = payload.variants.reduce((sum, variant) => sum + variant.stock, 0);
    }
  }

  if (!payload.images?.length && payload.image) {
    payload.images = [payload.image];
  }

  if (!payload.videos?.length && payload.video) {
    payload.videos = [payload.video];
  }

  return payload;
};

const getProducts = async (req, res) => {
  const products = await Product.find().sort({ sortOrder: 1, createdAt: 1 }).populate("category");
  res.json(products);
};

const getProductById = async (req, res) => {
  const product = await Product.findById(req.params.id).populate("category");
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json(product);
};

const createProduct = async (req, res) => {
  const product = await Product.create(normalizeProductPayload(req.body));
  res.status(201).json(product);
};

const updateProduct = async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    normalizeProductPayload(req.body),
    { new: true }
  );
  res.json(product);
};

const deleteProduct = async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: "Product deleted" });
};

module.exports = {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  updateProduct,
};
