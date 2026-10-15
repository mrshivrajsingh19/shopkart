const mongoose = require("mongoose");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");

const isValidProductId = (id) =>
  /^[0-9a-fA-F]{24}$/.test(id) && mongoose.Types.ObjectId.isValid(id);

const addToWishlist = async (req, res) => {
  const { productId } = req.params;

  if (!isValidProductId(productId)) {
    return res.status(400).json({ success: false, message: "Invalid product ID" });
  }

  try {
    const product = await Product.exists({ _id: productId });
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const customerId = req.user._id;
    const customer = await Customer.findOneAndUpdate(
      { _id: customerId, wishlist: { $ne: product._id } },
      { $addToSet: { wishlist: product._id } },
      { new: true }
    );

    if (!customer) {
      const customerExists = await Customer.exists({ _id: customerId });
      if (!customerExists) {
        return res.status(401).json({ success: false, message: "Customer not found" });
      }
      return res.status(409).json({ success: false, message: "Product is already in wishlist" });
    }

    return res.status(200).json({ success: true, message: "Product added to wishlist" });
  } catch (error) {
    console.error("Add Wishlist Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getWishlist = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id).populate({
      path: "wishlist",
      select: "name price category image stock",
    }).lean();

    if (!customer) {
      return res.status(401).json({ success: false, message: "Customer not found" });
    }

    const wishlist = customer.wishlist.filter(Boolean);
    return res.status(200).json({ success: true, count: wishlist.length, wishlist });
  } catch (error) {
    console.error("Get Wishlist Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const removeFromWishlist = async (req, res) => {
  const { productId } = req.params;

  if (!isValidProductId(productId)) {
    return res.status(400).json({ success: false, message: "Invalid product ID" });
  }

  try {
    const customerId = req.user._id;
    const customer = await Customer.findOneAndUpdate(
      { _id: customerId, wishlist: productId },
      { $pull: { wishlist: productId } },
      { new: true }
    );

    if (!customer) {
      const customerExists = await Customer.exists({ _id: customerId });
      if (!customerExists) {
        return res.status(401).json({ success: false, message: "Customer not found" });
      }
      return res.status(404).json({ success: false, message: "Product is not in wishlist" });
    }

    return res.status(200).json({ success: true, message: "Product removed from wishlist" });
  } catch (error) {
    console.error("Remove Wishlist Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = { addToWishlist, getWishlist, removeFromWishlist };
