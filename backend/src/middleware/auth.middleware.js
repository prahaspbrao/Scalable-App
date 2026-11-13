
import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
    try {
        // 1. Get Authorization header
        const authHeader = req.headers.authorization;

        // 2. Check whether token exists
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Access denied. Authentication token required.",
            });
        }

        // 3. Extract token
        const token = authHeader.split(" ")[1];

        // 4. Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 5. Attach authenticated user information
        req.user = {
            id: decoded.sub,
            role: decoded.role,
        };

        // 6. Continue to the next middleware/controller
        next();

    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Token has expired. Please login again.",
            });
        }

        return res.status(401).json({
            success: false,
            message: "Invalid authentication token.",
        });
    }
};


export const authorize = (...allowedRoles) => {
    return (req, res, next) => {

        // Check authentication
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        // Check user role
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to perform this action",
            });
        }

        next();
    };
};

