import { registerUser } from "../services/auth.service.js";

export const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    const result = await registerUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      phone,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result,
    });
  } catch (error) {
    if (error.message === "EMAIL_ALREADY_EXISTS") {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};