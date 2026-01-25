
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useStore } from '@/lib/store';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Plus, Search, MoreHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function FriendsPage() {
    const { friends, splitRequests } = useStore();

    // Calculate net balances
    const balances = friends.map(f => {
        const txs = splitRequests.filter(r => r.friendId === f.id || r.requesterId === f.id);
        let net = 0;
        txs.forEach(r => {
            if (r.status === 'paid') return;
            if (r.friendId === f.id) {
                net += r.amountOwed;
            } else {
                net -= r.amountOwed;
            }
        });
        return { ...f, net };
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Friends</h1>
                    <p className="text-muted-foreground">Keep track of your squad.</p>
                </div>
                <Button size="lg" className="rounded-full shadow-lg">
                    <Plus className="mr-2 h-4 w-4" /> Add Friend
                </Button>
            </div>

            <div className="flex items-center gap-4 bg-background p-1 rounded-xl border max-w-md">
                <Search className="w-5 h-5 ml-3 text-muted-foreground" />
                <Input placeholder="Search friends by name or phone..." className="border-0 focus-visible:ring-0" />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {balances.map(friend => (
                    <Card key={friend.id} className="group hover:border-primary/50 transition-all hover:shadow-md cursor-pointer">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                                <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-purple-400 text-white font-bold">
                                    {friend.avatarInitials}
                                </AvatarFallback>
                            </Avatar>
                            <Button variant="ghost" size="icon" className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="w-5 h-5" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <CardTitle className="text-lg mb-1">{friend.name}</CardTitle>
                            <div className="flex items-center justify-between mt-4">
                                <div>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Net Balance</div>
                                    <div className={`text-xl font-black ${friend.net >= 0 ? "text-green-600" : "text-red-600"}`}>
                                        {friend.net >= 0 ? '+' : '-'}${Math.abs(friend.net).toFixed(2)}
                                    </div>
                                </div>
                                <div className="text-xs text-right text-muted-foreground">
                                    {friend.net >= 0 ? 'owes you' : 'you owe'}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {/* Add Friend Card Placeholder */}
                <Card className="border-dashed flex flex-col items-center justify-center text-center p-6 text-muted-foreground hover:bg-muted/50 cursor-pointer transition-colors h-full min-h-[180px]">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                        <Plus className="w-6 h-6" />
                    </div>
                    <div className="font-medium">Invite a new friend</div>
                    <div className="text-xs mt-1">Send an invite link via iMessage</div>
                </Card>
            </div>
        </div>
    );
}
