const mongoose = require("mongoose");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");

const isValidProductId = (id) =>
  /^[0-9a-fA-F]{24}$/.test(id) && mongoose.Types.ObjectId.isValid(id);

const getPopulatedCart = async (customerId) => {
  const customer = await Customer.findById(customerId)
    .populate({ path: "cart.product", select: "name price image category stock" })
    .lean();
  return customer?.cart.filter((item) => item.product) || [];
};

const getCart = async (req, res) => {
  try {
    const cart = await getPopulatedCart(req.user._id);
    return res.status(200).json({ success: true, cart });
  } catch (error) {
    console.error("Get Cart Error:", error);
    return res.status(500).json({ success: false, message: "Unable to load cart" });
  }
};

const addToCart = async (req, res) => {
  const { productId } = req.params;

  if (!isValidProductId(productId)) {
    return res.status(400).json({ success: false, message: "Invalid product ID" });
  }

  try {
    const [customer, product] = await Promise.all([
      Customer.findById(req.user._id),
      Product.findById(productId),
    ]);

    if (!customer) {
      return res.status(401).json({ success: false, message: "Customer not found" });
    }
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const cartItem = customer.cart.find((item) => item.product.toString() === product._id.toString());
    const nextQuantity = (cartItem?.quantity || 0) + 1;

    if (nextQuantity > product.stock) {
      return res.status(400).json({ success: false, message: "Requested quantity exceeds available stock" });
    }

    if (cartItem) {
      cartItem.quantity = nextQuantity;
    } else {
      customer.cart.push({ product: product._id, quantity: 1 });
    }

    await customer.save();
    const cart = await getPopulatedCart(customer._id);
    return res.status(200).json({ success: true, message: "Cart updated", cart });
  } catch (error) {
    console.error("Add Cart Error:", error);
    return res.status(500).json({ success: false, message: "Unable to update cart" });
  }
};

const updateCartQuantity = async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  if (!isValidProductId(productId)) {
    return res.status(400).json({ success: false, message: "Invalid product ID" });
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({ success: false, message: "Quantity must be a whole number of at least 1" });
  }

  try {
    const [customer, product] = await Promise.all([
      Customer.findById(req.user._id),
      Product.findById(productId),
    ]);

    if (!customer) {
      return res.status(401).json({ success: false, message: "Customer not found" });
    }
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const cartItem = customer.cart.find((item) => item.product.toString() === product._id.toString());
    if (!cartItem) {
      return res.status(404).json({ success: false, message: "Product is not in cart" });
    }
    if (quantity > product.stock) {
      return res.status(400).json({ success: false, message: "Requested quantity exceeds available stock" });
    }

    cartItem.quantity = quantity;
    await customer.save();
    const cart = await getPopulatedCart(customer._id);
    return res.status(200).json({ success: true, message: "Cart quantity updated", cart });
  } catch (error) {
    console.error("Update Cart Error:", error);
    return res.status(500).json({ success: false, message: "Unable to update cart" });
  }
};

const removeFromCart = async (req, res) => {
  const { productId } = req.params;

  if (!isValidProductId(productId)) {
    return res.status(400).json({ success: false, message: "Invalid product ID" });
  }

  try {
    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(401).json({ success: false, message: "Customer not found" });
    }

    const existingLength = customer.cart.length;
    customer.cart = customer.cart.filter((item) => item.product.toString() !== productId);
    if (customer.cart.length === existingLength) {
      return res.status(404).json({ success: false, message: "Product is not in cart" });
    }

    await customer.save();
    const cart = await getPopulatedCart(customer._id);
    return res.status(200).json({ success: true, message: "Product removed from cart", cart });
  } catch (error) {
    console.error("Remove Cart Error:", error);
    return res.status(500).json({ success: false, message: "Unable to remove product from cart" });
  }
};

module.exports = { addToCart, getCart, updateCartQuantity, removeFromCart };
