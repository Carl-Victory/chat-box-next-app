/* eslint-disable @typescript-eslint/no-explicit-any */
// next-app/hooks/useSocket.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';

// Define the shape of a Message for the UI
export interface UIMessage {
    id: string; // The real DB ID, or 'local-{timestamp}' for optimistic messages
    localId?: string;
    senderId: string;
    receiverId: string;
    text: string;
    createdAt: string; // ISO string
    status: 'sending' | 'sent' | 'read' | 'failed';
}

const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:4000';

// Global Socket Reference
let socket: Socket | null = null;

export const useSocket = (currentUserId: string | undefined) => {
    const { data: session } = useSession();
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const peerIdRef = useRef<string | null>(null);

    // --- Core Connection Logic ---

    const fetchTokenAndConnect = useCallback(async () => {
        if (!currentUserId) return; // Must be authenticated

        try {
            // 1. Fetch SocketToken from the protected Next.js API route
            const res = await fetch('/api/socket/token', { method: 'POST' });
            const data = await res.json();

            if (!res.ok || !data.ok || !data.data.socketToken) {
                throw new Error(data.error || 'Failed to retrieve socket token.');
            }
            
            const socketToken = data.data.socketToken;

            // 2. Connect with the token
            if (socket) {
                socket.disconnect(); // Ensure old connection is closed
            }
            
            socket = io(SOCKET_SERVER_URL, {
                auth: { socketToken },
                transports: ['websocket'],
                reconnectionAttempts: 5,
            });

            // 3. Set up event listeners
            socket.on('connect', () => {
                setIsConnected(true);
                setError(null);
                console.log('Socket connected successfully.');
                
                // If we reconnect while in a DM room, rejoin it
                if (peerIdRef.current) {
                    joinDm(peerIdRef.current);
                }
            });

            socket.on('disconnect', (reason) => {
                setIsConnected(false);
                console.warn(`Socket disconnected: ${reason}`);
                if (reason === 'io server disconnect') {
                    // Manual disconnect (e.g., token validation failed), attempt reconnection with new token
                    setTimeout(fetchTokenAndConnect, 5000); 
                }
            });

            socket.on('connect_error', (err) => {
                console.error('Socket connection error:', err.message);
                setError(`Connection failed: ${err.message}. Retrying...`);
            });
            
            socket.on('error', (data) => {
                console.error('Server emitted error:', data);
                setError(data.message || 'A server error occurred.');
            });

        } catch (err) {
            console.error('Socket setup failed:', err);
            setError(err instanceof Error ? err.message : 'Unknown socket setup error.');
            setIsConnected(false);
            setTimeout(fetchTokenAndConnect, 10000); 
        }
    }, [currentUserId]);

    // --- Effect for initial connection / user change ---
    useEffect(() => {
        if (session?.user.id && !socket) {
            fetchTokenAndConnect();
        }
        
        return () => {
            // Clean up logic if needed
        };
    }, [session?.user.id, fetchTokenAndConnect]);


    // --- Exposed Methods ---
    
    // Join a DM room
    const joinDm = useCallback((peerId: string) => {
        if (socket && isConnected) {
            peerIdRef.current = peerId;
            socket.emit('join_dm', peerId, (error?: string) => {
                if (error) {
                    console.error('Failed to join DM room:', error);
                } else {
                    console.log(`Joined DM room with peer ${peerId}`);
                }
            });
        }
    }, [isConnected]);

    // Send a message and handle optimistic UI/acknowledgement
    const sendMessage = useCallback((
        toUserId: string, 
        text: string, 
        optimisticUpdate: (message: UIMessage) => void,
        ackCallback: (message: UIMessage, ackResponse: any) => void
    ) => {
        if (!socket || !isConnected || !currentUserId) {
            console.error('Socket not connected or user not defined.');
            return;
        }
        
        const localId = `local-${Date.now()}`;
        
        // 1. Optimistic UI update
        const optimisticMessage: UIMessage = {
            id: localId,
            localId,
            senderId: currentUserId,
            receiverId: toUserId,
            text,
            createdAt: new Date().toISOString(),
            status: 'sending',
        };
        optimisticUpdate(optimisticMessage);
        
        // 2. Emit to server with acknowledgement callback
        socket.emit('message:send', { toUserId, text, localId }, (response: { ok: boolean, id?: string, error?: string, localId?: string }) => {
            const acknowledgedMessage: UIMessage = {
                ...optimisticMessage,
                id: response.id || localId, 
                status: response.ok ? 'sent' : 'failed',
                text: response.ok ? text : `[FAILED] ${text}`,
            };
            
            ackCallback(acknowledgedMessage, response);
            if (!response.ok) {
                 console.error('Server message send failure:', response.error);
            }
        });

    }, [isConnected, currentUserId]);
    
    // Send typing status (Stage 9)
    const sendTyping = useCallback((peerId: string) => {
        if (socket && isConnected) {
            socket.emit('typing', { peerId }); 
        }
    }, [isConnected]);

    // Send stop typing status (Stage 9)
    const sendStopTyping = useCallback((peerId: string) => {
        if (socket && isConnected) {
            socket.emit('stop_typing', { peerId }); 
        }
    }, [isConnected]);


    // --- Exposed Subscriptions (Listeners) ---

    // Generic subscription helper
    const subscribe = useCallback((event: string, callback: (...args: any[]) => void) => {
        if (socket) {
            socket.on(event, callback);
        }
        return () => {
            if (socket) {
                socket.off(event, callback);
            }
        };
    }, []);
    
    // Specific message subscription
    const onMessageReceived = useCallback((callback: (message: Omit<UIMessage, 'status'>) => void) => {
        return subscribe('message:received', callback);
    }, [subscribe]);
    
    // Specific typing subscription (Stage 9)
    const onTypingStatus = useCallback((callback: (data: { fromUserId: string, isTyping: boolean }) => void) => {
        return subscribe('typing:status', callback);
    }, [subscribe]);


    return {
        isConnected,
        error,
        joinDm,
        sendMessage,
        sendTyping,
        sendStopTyping,
        onMessageReceived,
        onTypingStatus,
    };
};