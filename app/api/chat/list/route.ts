import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route"; // Adjust path as needed
import { NextResponse } from "next/server";
import prisma from "@/lib/connection.prisma"; // Assuming this is your Prisma Client import

// Define the expected output structure for clarity
interface ChatListItem {
  id: string;
  lastMessagePreview: string;
  otherUser: {
    id: string;
    username: string | null;
    image: string | null;
  };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  
  const mainUserId = session.user.id;

  try {
    // 1. Get all conversations the main user is a part of
    const conversations = await prisma.conversation.findMany({
      where: {
        participantIds: {
          has: mainUserId, // Find conversations that contain the main user's ID
        },
      },
      // We only need the conversation ID and the list of participants (2 IDs)
      select: {
        id: true,
        participantIds: true,
      },
      // Sort by the last updated/created message (Optional, but good for chat lists)
      orderBy: {
          createdAt: 'desc',
      }
    });

    // 2. Use Promise.all to process all conversations in parallel
    const chatListPromises = conversations.map(async (conversation) => {
      
      // A. Identify the other participant ID
      const otherParticipantId = conversation.participantIds.find(
        (id) => id !== mainUserId
      );

      if (!otherParticipantId) {
        // This should theoretically not happen in a 2-person chat
        console.warn(`Conversation ${conversation.id} missing partner ID.`);
        return null; 
      }

      // B. Fetch the other user's details
      const otherUser = await prisma.user.findFirst({
        where: { id: otherParticipantId },
        select: { id: true, username: true, image: true },
      });

      // C. Find the latest message between these two specific users (complex query)
      const latestMessage = await prisma.message.findFirst({
        where: {
          OR: [
            // Case 1: Main user sent message to partner
            { fromUserId: mainUserId, toUserId: otherParticipantId },
            // Case 2: Partner sent message to main user
            { fromUserId: otherParticipantId, toUserId: mainUserId },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true }, // Only need the content for the preview
      });
      
      // D. Assemble the final ChatListItem object
      return {
        id: conversation.id,
        // Ensure we access the content field or provide a fallback string
        lastMessagePreview:
          latestMessage?.content || `Start chat with ${otherUser?.username}`,
        otherUser: {
          id: otherUser?.id || '', // Use empty string fallback for safety
          username: otherUser?.username || 'Unknown User',
          image: otherUser?.image,
        },
      } as ChatListItem;
    });

    // 3. Wait for all database operations to complete
    const chatList = (await Promise.all(chatListPromises)).filter(
      (item): item is ChatListItem => item !== null
    );

    // 4. Return the final array
    return NextResponse.json(chatList);
  } catch (error) {
    console.error("Error fetching chat list:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
