import express from "express";

import { register, login, me } from "../controllers/auth.controller.js";

import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes
router.get("/me", protect, me);

router.get("/admin-test", protect, authorize("ADMIN"), (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome, Admin! Access granted.",
    user: req.user,
  });
});

export default router;
