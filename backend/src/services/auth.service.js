import prisma from "../config/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const registerUser = async ({ name, email, password, phone }) => {
  // 1. Check existing user
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("EMAIL_ALREADY_EXISTS");
  }

  // 2. Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // 3. Create user
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      phone: phone || null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  // 4. Generate JWT
  const token = jwt.sign(
    {
      sub: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    }
  );

  return { user, token };
};