const Product = require("../models/product.model");
const mongoose = require("mongoose");

const getWishlist = async (req, res) => {
  await req.user.populate({
    path: "wishlist",
    populate: { path: "category" },
  });
  res.json(req.user.wishlist);
};

const addToWishlist = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.productId)) {
    return res.status(400).json({ message: "A valid product ID is required" });
  }
  const product = await Product.findById(req.params.productId);
  if (!product) return res.status(404).json({ message: "Product not found" });

  const alreadySaved = req.user.wishlist.some(
    (productId) => productId.toString() === product._id.toString()
  );
  if (!alreadySaved) {
    req.user.wishlist.push(product._id);
    await req.user.save();
  }

  await req.user.populate({
    path: "wishlist",
    populate: { path: "category" },
  });
  res.status(201).json(req.user.wishlist);
};

const removeFromWishlist = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.productId)) {
    return res.status(400).json({ message: "A valid product ID is required" });
  }
  req.user.wishlist = req.user.wishlist.filter(
    (productId) => productId.toString() !== req.params.productId
  );
  await req.user.save();
  await req.user.populate({
    path: "wishlist",
    populate: { path: "category" },
  });
  res.json(req.user.wishlist);
};

module.exports = {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
};
