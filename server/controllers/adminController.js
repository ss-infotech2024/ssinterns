import Admin from "../models/adminModel.js";
import { generateToken } from "../utils/generateToken.js";

/**
 * @desc    Login admin
 * @route   POST /api/admin/login
 * @access  Public
 */
export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  try {
    const admin = await Admin.findOne({ email: email.toLowerCase().trim() }).select("+password");
    
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // THIS IS THE FIX: Include `id` in token
    const token = generateToken({ 
      id: admin._id,        // REQUIRED
      role: admin.role 
    });

    res.json({
      _id: admin._id,
      email: admin.email,
      role: admin.role,
      token, // Now contains `id`
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * @desc    Register admin (DEV ONLY)
 */
export const registerAdmin = async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ message: "Disabled in production" });
  }

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  const exists = await Admin.findOne({ email });
  if (exists) return res.status(400).json({ message: "Admin exists" });

  const admin = await Admin.create({ email, password });
  const token = generateToken({ id: admin._id, role: admin.role });

  res.status(201).json({
    _id: admin._id,
    email: admin.email,
    token,
  });
};

export const getAdminProfile = async (req, res) => {
  res.json(req.user);
};