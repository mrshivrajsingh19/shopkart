const mongoose = require("mongoose");
const Product = require("../models/product.model");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, image, stock } = req.body;

    if ([name, description, category, image].some((value) => typeof value !== "string" || !value.trim())) {
      return res.status(400).json({
        success: false,
        message: "Name, description, category, and image are required",
      });
    }

    const numericPrice = Number(price);
    const numericStock = Number(stock);

    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be a number greater than 0",
      });
    }

    if (!Number.isFinite(numericStock) || numericStock < 0) {
      return res.status(400).json({
        success: false,
        message: "Stock must be a number greater than or equal to 0",
      });
    }

    const product = await Product.create({
      name,
      description,
      price: numericPrice,
      category,
      image,
      stock: numericStock,
    });

    return res.status(201).json({ success: true, product });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ success: false, message: error.message });
    }

    console.error("Create Product Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getProducts = async (req, res) => {
  try {
    const { search, category, sort } = req.query;
    const query = {};

    if (typeof search === "string" && search.trim()) {
      query.name = { $regex: escapeRegex(search.trim()), $options: "i" };
    }

    if (typeof category === "string" && category.trim()) {
      query.category = category.trim();
    }

    const sortOption = sort === "price_asc"
      ? { price: 1 }
      : sort === "price_desc"
        ? { price: -1 }
        : {};

    const products = await Product.find(query)
      .select("name price category image stock")
      .sort(sortOption)
      .lean();

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Get Products Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^[0-9a-fA-F]{24}$/.test(id) || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const product = await Product.findById(id).lean();

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    return res.status(200).json({ success: true, product });
  } catch (error) {
    console.error("Get Product Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = { createProduct, getProducts, getProductById };
