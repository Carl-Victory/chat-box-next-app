/*
// next-app/app/api/messages/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from '../auth/[...nextauth]/route';
import  prisma from '@/lib/connection.prisma';
import { Prisma } from '@prisma/client';

// Default pagination settings
const DEFAULT_LIMIT = 30;

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.id) {
        return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserId = session.user.id;
    const { searchParams } = new URL(req.url);

    const peerId = searchParams.get('peerId');
    const limitParam = searchParams.get('limit');
    const cursor = searchParams.get('cursor'); // Message ID for cursor pagination

    if (!peerId) {
        return NextResponse.json({ ok: false, error: 'Missing peerId parameter' }, { status: 400 });
    }

    const limit = parseInt(limitParam || '', 10) || DEFAULT_LIMIT;
    // Fetch one extra item to check if there are more pages
    const fetchLimit = limit + 1; 

    try {
        // 1. Verify friendship 
        const isFriend = await prisma.friend.findFirst({
            where: {
                status: 'ACCEPTED',
                OR: [
                    { requesterId: currentUserId, receiverId: peerId },
                    { requesterId: peerId, receiverId: currentUserId },
                ],
            },
        });
        
        if (!isFriend) {
             return NextResponse.json({ ok: false, error: 'Access denied: Users are not accepted friends' }, { status: 403 });
        }


        // 2. Build Prisma Query
        const query: Prisma.MessageFindManyArgs = {
            take: fetchLimit,
            where: {
                OR: [
                    // Messages sent by me to peer
                    { senderId: currentUserId, receiverId: peerId },
                    // Messages sent by peer to me
                    { senderId: peerId, receiverId: currentUserId },
                ],
            },
            orderBy: {
                createdAt: 'desc', // Fetch newest first
            },
        };

        // Apply cursor logic for 'newer than' or 'ID before'
        if (cursor) {
             query.cursor = { id: cursor };
             query.skip = 1; // Skip the cursor message itself
        }

        const messages = await prisma.message.findMany(query);

        // 3. Process results for pagination
        const hasMore = messages.length > limit;
        const results = messages.slice(0, limit).reverse(); // Remove extra item and reverse to chronological order (oldest first)
        
        const nextCursor = hasMore ? messages[limit].id : null;


        return NextResponse.json({ 
            ok: true, 
            data: { 
                messages: results, 
                nextCursor, 
                hasMore 
            } 
        }, { status: 200 });

    } catch (error) {
        console.error('Fetch messages error:', error);
        return NextResponse.json({ ok: false, error: 'Internal server error while fetching messages' }, { status: 500 });
    }
}
    */