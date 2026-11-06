import prisma from "./prisma.js";

async function testConnection() {
  try {
    await prisma.$connect();

    console.log("Prisma connected successfully!");

    const users = await prisma.user.count();

    console.log("Total users:", users);
  } catch (error) {
    console.error("Database connection failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();