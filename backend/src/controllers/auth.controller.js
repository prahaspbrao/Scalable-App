import { registerUser } from "../services/auth.service.js";
import { loginUser } from "../services/auth.service.js";

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



export const login = async (req, res) => {
    try {
        console.log("LOGIN ROUTE HIT");
        console.log("Content-Type:", req.headers["content-type"]);
        console.log("Request body:", req.body);

        const { email, password } = req.body || {};

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const result = await loginUser({
            email: email.trim().toLowerCase(),
            password,
        });

        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: result,
        });

    } catch (error) {
        if (error.message === "INVALID_CREDENTIALS") {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        if (error.message === "ACCOUNT_INACTIVE") {
            return res.status(403).json({
                success: false,
                message: "Your account is inactive",
            });
        }

        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
