// next-app/components/AddFriendForm.tsx
"use client"
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddFriendForm() {
    const [username, setUsername] = useState('');
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);

        if (!username) {
            setMessage('Please enter a username.');
            setIsError(true);
            return;
        }

        try {
            const res = await fetch('/api/friends/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username.trim() }),
            });

            const data = await res.json();
            
            if (!res.ok || !data.ok) {
                setIsError(true);
                setMessage(data.error || 'Failed to send request.');
            } else {
                setIsError(false);
                setMessage(data.data.message);
                setUsername('');
                router.refresh(); 
            }
        } catch (error) {
            console.error(error);
            setIsError(true);
            setMessage('An unexpected error occurred.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex space-x-2">
            <input
                type="text"
                placeholder="Friend's username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="p-2 border rounded flex-grow"
            />
            <button type="submit" className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
                Send Request
            </button>
            {message && (
                <p className={`p-2 rounded text-sm ${isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {message}
                </p>
            )}
        </form>
    );
}