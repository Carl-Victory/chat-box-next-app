import { NextResponse } from "next/server";
import prisma from "@/lib/connection.prisma";

export async function GET(Username: string) {
  try {
    const user = await prisma.user.findFirst({
      where: {
        username: Username,
      },
      select: {
        id: true,
        username: true,
        image: true,
        email: true,
        name: true,
      },
    });
    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
