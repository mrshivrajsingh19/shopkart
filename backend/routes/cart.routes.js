const express = require("express");
const authenticate = require("../middlewares/auth.middleware");
const {
  addToCart,
  getCart,
  updateCartQuantity,
  removeFromCart,
} = require("../controllers/cart.controller");

const router = express.Router();

router.use(authenticate);
router.get("/", getCart);
router.post("/:productId", addToCart);
router.patch("/:productId", updateCartQuantity);
router.delete("/:productId", removeFromCart);

module.exports = router;
