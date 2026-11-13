const Category = require("../models/category.model");

const getCategories = async (req, res) => {
  res.json(await Category.find());
};

const createCategory = async (req, res) => {
  const category = await Category.create(req.body);
  res.status(201).json(category);
};

const updateCategory = async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(category);
};

const deleteCategory = async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.json({ message: "Category deleted" });
};

module.exports = {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
};
