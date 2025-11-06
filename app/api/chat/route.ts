import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "@/lib/connection.prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { userId1, userId2 } = await req.json();

  console.log(userId1, userId2);

  if (session.user.id !== userId1 && session.user.id !== userId2) {
    return NextResponse.json(
      { message: "User IDs do not match session." },
      { status: 403 }
    );
  }
  if (!userId1 || !userId2) {
    return NextResponse.json({ message: "Missing user IDs." }, { status: 400 });
  }

  if (userId1 === userId2) {
    return NextResponse.json(
      { message: "Cannot create chat with self." },
      { status: 400 }
    );
  }

  const [userAId, userBId] = [userId1, userId2].sort();
  const participantIds = [userAId, userBId];

  try {
    const conversation = await prisma.conversation.findFirst({
      where: {
        participantIds: {
          hasEvery: [userAId, userBId],
        },
      },
      select: {
        id: true,
        participantIds: true,
      },
    });

    const latestMessage = await prisma.message.findFirst({
      where: {
        OR: [
          // Case 1: User1 sent to User2
          {
            fromUserId: userAId,
            toUserId: userBId,
          },
          // Case 2: User2 sent to User1
          {
            fromUserId: userBId,
            toUserId: userAId,
          },
        ],
      },
      // Order by creation time descending to get the newest one first
      orderBy: {
        createdAt: "desc",
      },
      // Only fetch the single most recent result
      take: 1,
      // Only select the content field to keep the query light
      select: {
        content: true,
      },
    });

    const secondUser = await prisma.user.findFirst({
      where: { id: participantIds[0] },
    });

    const data = {
      id: conversation?.id,
      lastMessagePreview:
        latestMessage || `Start chat with ${secondUser?.username}`,
      otherUser: {
        id: secondUser?.id,
        username: secondUser?.username,
        image: secondUser?.image,
      },
    };

    if (conversation) {
      return NextResponse.json(data);
    }

    const newConversation = await prisma.conversation.create({
      data: {
        participantIds: [userAId, userBId],
      },
    });

    return NextResponse.json(newConversation, { status: 201 });
  } catch (error) {
    console.error("Error creating chat:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
