const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "fallback_secret_123", {
    expiresIn: "7d",
  });
};

// POST /api/auth/register
const register = async (req, res) => {
  try {
    console.log("📝 Register attempt:", req.body?.email);
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const cleanEmail = email.toLowerCase().trim();

    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
    });

    const token = signToken(user._id);
    console.log("✅ User registered:", cleanEmail);

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("❌ Register error:", error.message);
    if (error.code === 11000) {
      return res.status(400).json({ error: "Email already registered" });
    }
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ error: messages.join(", ") });
    }
    res.status(500).json({ error: "Registration failed: " + error.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    console.log("🔐 Login attempt:", req.body?.email);
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail }).select("+password");

    if (!user) {
      console.log("❌ User not found:", cleanEmail);
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("❌ Wrong password for:", cleanEmail);
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = signToken(user._id);
    console.log("✅ User logged in:", cleanEmail);

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("❌ Login error:", error.message);
    res.status(500).json({ error: "Login failed: " + error.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    res.json({
      user: { id: req.user._id, name: req.user.name, email: req.user.email },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to get user" });
  }
};

module.exports = { register, login, getMe };