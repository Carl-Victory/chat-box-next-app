import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "@/lib/connection.prisma";
import { Prisma } from "@prisma/client";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user.id) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { username } = await req.json();

  if (!username || typeof username !== "string") {
    return NextResponse.json(
      { ok: false, error: "Invalid username provided" },
      { status: 400 }
    );
  }

  /* if (session.user.username) {
    // Optionally allow changing later, but for onboarding, we prevent re-set.
    // For now, allow update for testing, but ideally, this would be a separate endpoint.
    // Let's proceed with allowing the update for now.
  }*/

  try {
    // Ensure we use a valid database id. Sometimes session.user.id may contain
    // a provider id (e.g. Google profile id) which is not a MongoDB ObjectId.
    let userId = session.user.id as string;

    const isHex24 =
      typeof userId === "string" && /^[a-fA-F0-9]{24}$/.test(userId);

    if (!isHex24) {
      // Try to resolve the real DB id using the user's email
      if (!session.user.email) {
        return NextResponse.json(
          { ok: false, error: "Unable to determine user id" },
          { status: 400 }
        );
      }

      const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });

      if (!dbUser) {
        return NextResponse.json(
          { ok: false, error: "User not found in database" },
          { status: 404 }
        );
      }

      userId = dbUser.id;
    }



    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { username: username },
      select: { username: true },
    });

    return NextResponse.json(
      { ok: true, data: { username: updatedUser.username } },
      { status: 200 }
    );
  } catch (error) {
    // Handle Prisma unique constraint violation error (P2002)
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { ok: false, error: "This username is already taken." },
        { status: 409 }
      );
    }

    console.error("Username update error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error while setting username." },
      { status: 500 }
    );
  }
}
