import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/connection.prisma";

const saltRounds = 10;

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (
      !email ||
      !password ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return NextResponse.json(
        { ok: false, error: "Invalid email or password" },
        { status: 400 }
      );
    }
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { ok: false, error: "User already exists" },
        { status: 409 }
      );
    }
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });
    return NextResponse.json({
      ok: true,
      data: {
        id: user.id,
        email: user.email,
        message: "User registered successfully",
      },
      status: 201,
    });
  } catch (error) {
    console.error("Error in registration:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error during registration" },
      { status: 500 }
    );
  }
}
