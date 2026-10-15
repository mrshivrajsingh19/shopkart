const Razorpay = require("razorpay");

const hasRazorpayKeys = () =>
  Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

const createRazorpayClient = () => {
  if (!hasRazorpayKeys()) return null;

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

module.exports = { createRazorpayClient, hasRazorpayKeys };
