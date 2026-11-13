const Cart = require("../models/cart.model");
const Product = require("../models/product.model");

const populatedCart = (userId) =>
  Cart.findOne({ user: userId }).populate("items.product");

const getVariant = (product, variantId) => {
  if (!variantId) return null;
  return product.variants?.id?.(variantId) || product.variants?.find(
    (variant) => variant._id.toString() === variantId.toString()
  );
};

const getCart = async (req, res) => {
  let cart = await populatedCart(req.user._id);
  if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });
  res.json(cart);
};

const addToCart = async (req, res) => {
  const { productId, quantity = 1, variantId } = req.body;
  if (typeof productId !== "string" || !productId) {
    return res.status(400).json({ message: "A valid product ID is required" });
  }
  const amount = Number(quantity);
  if (!Number.isInteger(amount) || amount < 1) {
    return res.status(400).json({ message: "Quantity must be a positive whole number" });
  }

  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ message: "Product not found" });
  const variant = getVariant(product, variantId);
  if (variantId && !variant) return res.status(404).json({ message: "Variant not found" });
  const availableStock = variant ? variant.stock : product.stock;
  if (availableStock < amount) {
    return res.status(400).json({ message: "Requested quantity is not available" });
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });

  const item = cart.items.find(
    (i) =>
      i.product.toString() === productId &&
      String(i.variantId || "") === String(variant?._id || "")
  );
  if (item) {
    if (item.quantity + amount > availableStock) {
      return res.status(400).json({ message: "Requested quantity exceeds available stock" });
    }
    item.quantity += amount;
  } else {
    cart.items.push({
      product: productId,
      variantId: variant?._id?.toString(),
      variantName: variant?.name,
      quantity: amount,
    });
  }

  await cart.save();
  res.status(201).json(await populatedCart(req.user._id));
};

const updateCartItem = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return res.status(404).json({ message: "Cart not found" });
  const item = cart.items.id(req.params.itemId);
  if (!item) return res.status(404).json({ message: "Item not found" });

  const quantity = Number(req.body.quantity);
  if (!Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({ message: "Quantity must be a positive whole number" });
  }
  const product = await Product.findById(item.product);
  const variant = product ? getVariant(product, item.variantId) : null;
  const availableStock = variant ? variant.stock : product?.stock;
  if (!product || quantity > availableStock) {
    return res.status(400).json({ message: "Requested quantity is not available" });
  }

  item.quantity = quantity;
  await cart.save();
  res.json(await populatedCart(req.user._id));
};

const removeCartItem = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return res.status(404).json({ message: "Cart not found" });
  const item = cart.items.id(req.params.itemId);
  if (!item) return res.status(404).json({ message: "Item not found" });

  item.deleteOne();
  await cart.save();
  res.json(await populatedCart(req.user._id));
};

const clearCart = async (req, res) => {
  const cart = await Cart.findOneAndUpdate(
    { user: req.user._id },
    { items: [] },
    { new: true }
  );
  res.json(cart);
};

module.exports = {
  addToCart,
  clearCart,
  getCart,
  removeCartItem,
  updateCartItem,
};
