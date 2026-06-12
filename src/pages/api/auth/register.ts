import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../server/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters long")
    .max(20, "Username must be at most 20 characters long")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: `Method ${req.method ?? "UNKNOWN"} Not Allowed` });
  }

  try {
    const body = registerSchema.safeParse(req.body);
    if (!body.success) {
      const errorMessage = body.error.issues[0]?.message || "Invalid input data";
      return res.status(400).json({ message: errorMessage });
    }

    const { username, password } = body.data;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        name: {
          equals: username,
          mode: "insensitive", // case-insensitive check
        },
      },
    });

    if (existingUser) {
      return res.status(409).json({ message: "Username is already taken" });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user in DB
    const user = await prisma.user.create({
      data: {
        name: username,
        password: hashedPassword,
      },
    });

    return res.status(201).json({
      message: "User registered successfully",
      userId: user.id,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ message: "Something went wrong. Please try again." });
  }
}
