import prisma from "@/lib/connection.prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, username: true },
  });

  if (!currentUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // `params` may be provided as a Promise in the platform context — await it.
  const params = await context.params;
  const { username: otherUsername } = params as { username: string };

  const otherUser = await prisma.user.findUnique({
    where: { username: otherUsername },
    select: { id: true, username: true },
  });

  if (!otherUser) {
    return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
  }

  // Fetch messages both ways
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { fromUserId: currentUser.id, toUserId: otherUser.id },
        { fromUserId: otherUser.id, toUserId: currentUser.id },
      ],
    },
    include: {
      fromUser: { select: { id: true, username: true, image: true } },
      toUser: { select: { id: true, username: true, image: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(messages);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ username: string }> } // context.params may be a Promise
) {
  const session = await getServerSession(authOptions);
  if (!session)
    return new Response(JSON.stringify({ error: "Unautorized" }), {
      status: 401,
    });
  const body = await req.json();
  const { content } = body;

  // Resolve params before using
  const params = await context.params;
  const { username: receiverUsername } = params as { username: string };

  const receiver = await prisma.user.findUnique({
    where: { username: receiverUsername },
  });
  if (!receiver)
    return new Response(JSON.stringify({ message: "Receiver not found" }), {
      status: 404,
    });
  const message = await prisma.message.create({
    data: {
      fromUserId: session.user.id as string,
      toUserId: receiver.id as string,
      content,
    },
  });
  // Notify socket server via a secure REST call
  await fetch(process.env.SOCKET_SERVER_URL + "/emit-message", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-server-secret": process.env.SOCKET_SERVER_SECRET!, // server-to-server secret
    },
    body: JSON.stringify({ message }),
  });

  return new Response(JSON.stringify(message), { status: 201 });
}
