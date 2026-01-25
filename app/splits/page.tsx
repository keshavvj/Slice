
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStore } from '@/lib/store';
import { detectSmartSplits } from '@/lib/logic';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Plus, Check, Clock, User as UserIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

export default function SplitsPage() {
    const { transactions, splitRequests, friends, createSplitRequest, markSplitPaid, user } = useStore();
    const [suggestions, setSuggestions] = React.useState<string[]>([]);

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [selectedTxId, setSelectedTxId] = React.useState<string>("");
    const [selectedFriendIds, setSelectedFriendIds] = React.useState<string[]>([]);

    React.useEffect(() => {
        const detected = detectSmartSplits(transactions, splitRequests);
        setSuggestions(detected);
    }, [transactions, splitRequests]);

    const handleCreateSplit = () => {
        if (!selectedTxId || selectedFriendIds.length === 0) return;

        const tx = transactions.find(t => t.id === selectedTxId);
        if (!tx) return;

        const splitAmount = tx.amount / (selectedFriendIds.length + 1);

        selectedFriendIds.forEach(friendId => {
            createSplitRequest({
                id: `sr_${Date.now()}_${Math.random()}`,
                transactionId: tx.id,
                requesterId: user.id,
                friendId: friendId,
                totalAmount: tx.amount,
                amountOwed: Number(splitAmount.toFixed(2)),
                status: 'pending',
                createdAt: new Date().toISOString()
            });
        });

        setIsDialogOpen(false);
        setSelectedTxId("");
        setSelectedFriendIds([]);
    };

    const toggleFriend = (id: string) => {
        setSelectedFriendIds(prev =>
            prev.includes(id)
                ? prev.filter(fid => fid !== id)
                : [...prev, id]
        );
    };

    const selectedTx = transactions.find(t => t.id === selectedTxId);
    const splitAmountPreview = selectedTx ? (selectedTx.amount / (selectedFriendIds.length + 1)).toFixed(2) : "0.00";

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Split Requests</h1>
                    <p className="text-muted-foreground">Manage bills and shared expenses.</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="lg" className="rounded-full shadow-lg">
                            <Plus className="mr-2 h-4 w-4" /> New Split
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Create a Split Request</DialogTitle>
                            <DialogDescription>
                                Select a transaction and friends to split it with.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Transaction</Label>
                                <Select value={selectedTxId} onValueChange={setSelectedTxId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select transaction to split" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {transactions.slice(0, 10).map(tx => (
                                            <SelectItem key={tx.id} value={tx.id}>
                                                {tx.merchant_name} (${tx.amount.toFixed(2)})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label>Select Friends</Label>
                                <div className="border rounded-md p-4 space-y-3 max-h-[200px] overflow-y-auto">
                                    {friends.length === 0 ? (
                                        <div className="text-sm text-muted-foreground text-center">No friends added yet.</div>
                                    ) : (
                                        friends.map(friend => (
                                            <div key={friend.id} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`friend-${friend.id}`}
                                                    checked={selectedFriendIds.includes(friend.id)}
                                                    onCheckedChange={() => toggleFriend(friend.id)}
                                                />
                                                <label
                                                    htmlFor={`friend-${friend.id}`}
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                >
                                                    {friend.name}
                                                </label>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {selectedTx && selectedFriendIds.length > 0 && (
                                <div className="bg-muted p-3 rounded-lg text-sm flex justify-between items-center">
                                    <span>Each person pays:</span>
                                    <span className="font-bold text-lg text-primary">${splitAmountPreview}</span>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreateSplit} disabled={!selectedTxId || selectedFriendIds.length === 0}>Send Split Request</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
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
                            {(() => {
                                const totalOwedToMe = splitRequests
                                    .filter(r => r.requesterId === user.id && r.status === 'pending')
                                    .reduce((sum, r) => sum + r.amountOwed, 0);

                                const totalIOwe = splitRequests
                                    .filter(r => r.friendId === user.id && r.status === 'pending')
                                    .reduce((sum, r) => sum + r.amountOwed, 0);

                                const net = totalOwedToMe - totalIOwe;

                                return (
                                    <>
                                        <div className="flex items-center justify-between border-b pb-4">
                                            <span className="text-sm">You are owed</span>
                                            <span className="text-green-600 font-bold">${totalOwedToMe.toFixed(2)}</span>
                                        </div>
                                        <div className="flex items-center justify-between border-b pb-4">
                                            <span className="text-sm">You owe</span>
                                            <span className="text-red-500 font-bold">${totalIOwe.toFixed(2)}</span>
                                        </div>
                                        <div className="flex items-center justify-between pt-2">
                                            <span className="font-semibold">Total Net</span>
                                            <span className={`font-black text-xl ${net >= 0 ? "text-green-600" : "text-red-600"}`}>
                                                {net >= 0 ? '+' : '-'}${Math.abs(net).toFixed(2)}
                                            </span>
                                        </div>
                                    </>
                                );
                            })()}
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
