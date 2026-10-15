const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const customerRoutes = require("./routes/customer.routes");
const productRoutes = require("./routes/product.routes");
const wishlistRoutes = require("./routes/wishlist.routes");
const cartRoutes = require("./routes/cart.routes");
const orderRoutes = require("./routes/order.routes");

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

// Recover original URL when rewritten on Vercel
app.use((req, res, next) => {
  const matched = req.headers["x-matched-path"];
  if (matched && matched !== "/api" && matched !== "/api/index.js") {
    req.url = matched;
  }
  next();
});

// Connect to MongoDB helper with cached connection
let isConnected = false;
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not defined");
  }
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 8000,
  });
  isConnected = true;
  console.log("Connected to MongoDB");
};

// Ensure DB connected before processing routes
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    res.status(500).json({ success: false, message: "Database connection error: " + err.message });
  }
});

// Routes - support both with and without /api prefix
app.use("/customers", customerRoutes);
app.use("/api/customers", customerRoutes);

app.use("/products", productRoutes);
app.use("/api/products", productRoutes);

app.use("/wishlist", wishlistRoutes);
app.use("/api/wishlist", wishlistRoutes);

app.use("/cart", cartRoutes);
app.use("/api/cart", cartRoutes);

app.use("/orders", orderRoutes);
app.use("/api/orders", orderRoutes);

app.get("/api", (req, res) => {
  res.json({ message: "ShopKart API is running" });
});

app.get("/", (req, res) => {
  res.json({ message: "ShopKart API is running" });
});

module.exports = { app, connectDB };