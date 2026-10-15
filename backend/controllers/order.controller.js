const crypto = require("crypto");
const mongoose = require("mongoose");
const Customer = require("../models/customer.model");
const Order = require("../models/order.model");
const { createRazorpayClient, hasRazorpayKeys } = require("../config/razorpay");

const validateShippingAddress = (address) => {
  const requiredFields = ["fullName", "phone", "addressLine1", "city", "state", "pincode"];
  if (!address || requiredFields.some((field) => typeof address[field] !== "string" || !address[field].trim())) {
    return "All shipping fields are required";
  }

  const phoneDigits = address.phone.replace(/\D/g, "");
  if (phoneDigits.length < 10 || phoneDigits.length > 15) {
    return "Enter a valid phone number";
  }
  if (!/^\d{6}$/.test(address.pincode.trim())) {
    return "Pincode must contain 6 digits";
  }
  return null;
};

const createPaymentOrder = async (req, res) => {
  const validationError = validateShippingAddress(req.body.shippingAddress);
  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  try {
    const customer = await Customer.findById(req.user._id).populate({
      path: "cart.product",
      select: "name price image stock",
    });

    if (!customer) {
      return res.status(401).json({ success: false, message: "Customer not found" });
    }
    if (!customer.cart.length) {
      return res.status(400).json({ success: false, message: "Your cart is empty" });
    }

    const items = [];
    let totalAmount = 0;

    for (const cartItem of customer.cart) {
      const product = cartItem.product;
      if (!product) {
        return res.status(404).json({ success: false, message: "A cart product no longer exists" });
      }
      if (cartItem.quantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Only ${product.stock} available.`,
        });
      }

      items.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: cartItem.quantity,
        image: product.image,
      });
      totalAmount += product.price * cartItem.quantity;
    }

    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      return res.status(400).json({ success: false, message: "Order total must be greater than zero" });
    }
    if (!hasRazorpayKeys()) {
      return res.status(503).json({
        success: false,
        message: "Razorpay Test Mode keys are not configured on the backend",
      });
    }

    const order = await Order.create({
      user: customer._id,
      items,
      shippingAddress: {
        fullName: req.body.shippingAddress.fullName.trim(),
        phone: req.body.shippingAddress.phone.trim(),
        addressLine1: req.body.shippingAddress.addressLine1.trim(),
        city: req.body.shippingAddress.city.trim(),
        state: req.body.shippingAddress.state.trim(),
        pincode: req.body.shippingAddress.pincode.trim(),
      },
      totalAmount,
      paymentStatus: "PENDING",
      status: "PENDING_PAYMENT",
    });

    try {
      const razorpay = createRazorpayClient();
      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(totalAmount * 100),
        currency: "INR",
        receipt: order._id.toString(),
      });

      order.razorpayOrderId = razorpayOrder.id;
      await order.save();

      return res.status(201).json({
        success: true,
        shopKartOrderId: order._id,
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key: process.env.RAZORPAY_KEY_ID,
        order,
      });
    } catch (paymentError) {
      await Order.deleteOne({ _id: order._id, user: customer._id });
      console.error("Razorpay Order Error:", paymentError.message);
      return res.status(502).json({ success: false, message: "Unable to start test payment. Your cart is unchanged." });
    }
  } catch (error) {
    console.error("Create Order Error:", error);
    return res.status(500).json({ success: false, message: "Unable to create order" });
  }
};

const verifyPayment = async (req, res) => {
  const {
    shopKartOrderId,
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: razorpayPaymentId,
    razorpay_signature: razorpaySignature,
  } = req.body;

  if (!mongoose.Types.ObjectId.isValid(shopKartOrderId)
    || !razorpayOrderId
    || !razorpayPaymentId
    || !/^[a-f0-9]{64}$/i.test(razorpaySignature || "")) {
    return res.status(400).json({ success: false, message: "Payment verification details are invalid" });
  }
  if (!hasRazorpayKeys()) {
    return res.status(503).json({ success: false, message: "Razorpay Test Mode keys are not configured on the backend" });
  }

  try {
    const order = await Order.findOne({ _id: shopKartOrderId, user: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    if (order.paymentStatus === "PAID") {
      await Customer.updateOne({ _id: req.user._id }, { $set: { cart: [] } });
      return res.status(200).json({ success: true, message: "Payment already verified", order });
    }
    if (order.razorpayOrderId !== razorpayOrderId) {
      return res.status(400).json({ success: false, message: "Payment order does not match" });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${order.razorpayOrderId}|${razorpayPaymentId}`)
      .digest();
    const providedSignature = Buffer.from(razorpaySignature, "hex");

    if (providedSignature.length !== expectedSignature.length
      || !crypto.timingSafeEqual(expectedSignature, providedSignature)) {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    order.paymentStatus = "PAID";
    order.status = "PLACED";
    order.razorpayPaymentId = razorpayPaymentId;
    await order.save();

    await Customer.updateOne({ _id: req.user._id }, { $set: { cart: [] } });

    return res.status(200).json({ success: true, message: "Payment verified and order placed", order });
  } catch (error) {
    console.error("Verify Payment Error:", error);
    return res.status(500).json({ success: false, message: "Unable to verify payment" });
  }
};

const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error("Get Orders Error:", error);
    return res.status(500).json({ success: false, message: "Unable to load orders" });
  }
};

const getOrderById = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid order ID" });
  }

  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id }).lean();
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    return res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("Get Order Error:", error);
    return res.status(500).json({ success: false, message: "Unable to load order" });
  }
};

module.exports = { createPaymentOrder, verifyPayment, getOrders, getOrderById };
