/*
// next-app/app/api/messages/mark-read/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from '../../auth/[...nextauth]/route';
import  prisma  from '@/lib/connection.prisma';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.id) {
        return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { peerId } = await req.json();
    const currentUserId = session.user.id;

    if (!peerId) {
        return NextResponse.json({ ok: false, error: 'Missing peerId' }, { status: 400 });
    }

    try {
        // Mark all messages sent FROM the peer TO the current user as read.
        const updateResult = await prisma.message.updateMany({
            where: {
                senderId: peerId,
                receiverId: currentUserId,
                isRead: false,
            },
            data: {
                isRead: true,
            },
        });

        return NextResponse.json({ 
            ok: true, 
            data: { 
                count: updateResult.count,
                message: `Marked ${updateResult.count} messages from ${peerId} as read.`
            } 
        }, { status: 200 });

    } catch (error) {
        console.error('Mark read error:', error);
        return NextResponse.json({ ok: false, error: 'Internal server error while marking messages as read' }, { status: 500 });
    }
}
    */