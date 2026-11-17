
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import productRoutes from "./routes/product.routes.js";

dotenv.config();

const app = express();

// Request parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
    cors({
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        credentials: true,
    })
);

// HTTP request logging
app.use(morgan("dev"));

// Health check endpoint
app.get("/api/v1/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "NEXORA API is running!",
        timestamp: new Date().toISOString(),
    });
});

// Authentication routes
app.use("/api/v1/auth", authRoutes);

// Categories routes
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/products", productRoutes);

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`API running on port ${PORT}`);
});
