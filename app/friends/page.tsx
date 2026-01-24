'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStore } from '@/lib/store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function FriendsPage() {
    const { friends, splitRequests } = useStore();

    // Calculate net balances
    // Positive: they owe me. Negative: I owe them.
    const balances = friends.map(f => {
        const txs = splitRequests.filter(r => r.friendId === f.id || r.requesterId === f.id);
        let net = 0;
        txs.forEach(r => {
            if (r.status === 'paid') return;
            // If I requested (requesterId = me), friendId = f. They owe me amountOwed.
            // If they requested (requesterId = f), friendId = me. I owe them amountOwed.
            // In seed, requesterId is usually u_123 (me).
            if (r.friendId === f.id) {
                net += r.amountOwed;
            } else {
                net -= r.amountOwed;
            }
        });
        return { ...f, net };
    });

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Friends</h1>
            <div className="grid gap-4 md:grid-cols-3">
                {balances.map(friend => (
                    <Card key={friend.id}>
                        <CardHeader className="flex flex-row items-center gap-4">
                            <Avatar>
                                <AvatarFallback>{friend.avatarInitials}</AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className="text-base">{friend.name}</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold mb-1">
                                {friend.net >= 0 ?
                                    <span className="text-green-600">+${friend.net.toFixed(2)}</span>
                                    : <span className="text-red-600">-${Math.abs(friend.net).toFixed(2)}</span>
                                }
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {friend.net >= 0 ? 'owes you' : 'you owe'}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
