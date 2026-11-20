
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import productRoutes from "./routes/product.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import cartRoutes from "./routes/cart.routes.js";

dotenv.config();

const app = express();

// ========================================
// 1. Request Parsing Middleware
// ========================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Temporary request debugging
app.use((req, res, next) => {
    console.log("\n========== INCOMING REQUEST ==========");
    console.log("METHOD:", req.method);
    console.log("URL:", req.originalUrl);
    console.log("CONTENT-TYPE:", req.headers["content-type"]);
    console.log("BODY:", req.body);
    console.log("======================================\n");

    next();
});

// ========================================
// 2. Security Middleware
// ========================================
app.use(helmet());

// ========================================
// 3. CORS Configuration
// ========================================
app.use(
    cors({
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        credentials: true,
    })
);

// ========================================
// 4. HTTP Request Logging
// ========================================
app.use(morgan("dev"));

// ========================================
// 5. Health Check Endpoint
// ========================================
app.get("/api/v1/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "NEXORA API is running!",
        timestamp: new Date().toISOString(),
    });
});

// ========================================
// 6. API Routes
// ========================================
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/inventory", inventoryRoutes);
app.use("/api/v1/cart", cartRoutes);

// ========================================
// 7. Start Server
// ========================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`NEXORA API running on port ${PORT}`);
});
