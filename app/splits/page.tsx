
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStore } from '@/lib/store';
import { detectSmartSplits } from '@/lib/logic';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Plus, Check, Clock, User as UserIcon } from 'lucide-react';

export default function SplitsPage() {
    const { transactions, splitRequests, friends, createSplitRequest, markSplitPaid, user } = useStore();
    const [suggestions, setSuggestions] = React.useState<string[]>([]);

    React.useEffect(() => {
        const detected = detectSmartSplits(transactions, splitRequests);
        setSuggestions(detected);
    }, [transactions, splitRequests]);

    const handleCreateSplit = () => {
        const tx = transactions[0]; // Logic would pick a specific transaction
        if (!tx) return;

        createSplitRequest({
            id: `sr_${Date.now()}`,
            transactionId: tx.id,
            requesterId: user.id,
            friendId: friends[0]?.id || 'unknown',
            totalAmount: tx.amount,
            amountOwed: tx.amount / 2,
            status: 'pending',
            createdAt: new Date().toISOString()
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Split Requests</h1>
                    <p className="text-muted-foreground">Manage bills and shared expenses.</p>
                </div>
                <Button onClick={handleCreateSplit} size="lg" className="rounded-full shadow-lg">
                    <Plus className="mr-2 h-4 w-4" /> New Split
                </Button>
            </div>

            {suggestions.length > 0 && (
                <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 p-4 rounded-xl flex items-center gap-4">
                    <div className="p-2 bg-indigo-500/20 rounded-full text-indigo-600 dark:text-indigo-400">
                        <Plus className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-sm">Smart Suggestion</h3>
                        <p className="text-xs text-muted-foreground">
                            You often split <strong>{suggestions.join(", ")}</strong>.
                        </p>
                    </div>
                    <Button variant="secondary" size="sm">Auto-Split</Button>
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                {/* Active Requests List */}
                <div className="space-y-4">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Active Requests</h2>
                    {splitRequests.length === 0 ? (
                        <div className="p-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center text-muted-foreground">
                            <Check className="w-8 h-8 mb-2 opacity-20" />
                            <p>All settled up!</p>
                        </div>
                    ) : (
                        splitRequests.map(req => {
                            const friend = friends.find(f => f.id === req.friendId);
                            const isIncoming = req.friendId === user.id; // If I am the friend, I owe money (incoming req)

                            return (
                                <Card key={req.id} className="group hover:border-primary/50 transition-colors">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-10 w-10 border">
                                                <AvatarFallback>{friend?.avatarInitials || '?'}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-semibold flex items-center gap-2">
                                                    {friend?.name || 'Unknown'}
                                                    {req.status === 'paid' && <Badge variant="secondary" className="text-[10px] h-5 px-1 bg-green-100 text-green-700">PAID</Badge>}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {new Date(req.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-black text-lg">
                                                ${req.amountOwed.toFixed(2)}
                                            </div>
                                            {req.status === 'pending' && (
                                                <div className="mt-1">
                                                    {isIncoming ? (
                                                        <Button size="sm" onClick={() => markSplitPaid(req.id)}>Pay Now</Button>
                                                    ) : (
                                                        <span className="text-xs text-orange-500 font-medium flex items-center justify-end gap-1">
                                                            <Clock className="w-3 h-3" /> Pending
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>

                {/* Summary Card */}
                <div>
                    <Card className="bg-muted/30 border-muted">
                        <CardHeader>
                            <CardTitle>Summary</CardTitle>
                            <CardDescription>Your net position across all friends.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between border-b pb-4">
                                <span className="text-sm">You are owed</span>
                                <span className="text-green-600 font-bold">$450.00</span>
                            </div>
                            <div className="flex items-center justify-between border-b pb-4">
                                <span className="text-sm">You owe</span>
                                <span className="text-red-500 font-bold">$12.50</span>
                            </div>
                            <div className="flex items-center justify-between pt-2">
                                <span className="font-semibold">Total Net</span>
                                <span className="text-green-600 font-black text-xl">+$437.50</span>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="mt-6 p-4 rounded-xl bg-blue-500 text-white shadow-xl shadow-blue-500/20">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <UserIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold">Add a Friend</h3>
                                <p className="text-sm text-blue-100 mb-3">Sync contacts to find friends on Slice.</p>
                                <Button size="sm" variant="secondary" className="w-full text-blue-600">Sync Contacts</Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
