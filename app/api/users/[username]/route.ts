import { NextResponse, type NextRequest } from "next/server";
import prisma from "@/lib/connection.prisma";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  const params = await context.params;
  const { username } = params;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        image: true,
      },
    });
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}