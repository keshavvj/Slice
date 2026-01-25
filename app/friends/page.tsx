
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useStore } from '@/lib/store';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Plus, Search, MoreHorizontal, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function FriendsPage() {
    const { friends, splitRequests, transactions, addFriend, removeFriend } = useStore();
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [selectedFriend, setSelectedFriend] = React.useState<any>(null);
    const [newFriendName, setNewFriendName] = React.useState("");
    const [newFriendEmail, setNewFriendEmail] = React.useState("");
    const [newFriendPhone, setNewFriendPhone] = React.useState("");
    const [searchQuery, setSearchQuery] = React.useState("");

    const handleAddFriend = () => {
        if (!newFriendName) return;

        const initials = newFriendName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

        addFriend({
            id: `friend_${Date.now()}`,
            name: newFriendName,
            phoneNumber: newFriendPhone,
            avatarInitials: initials
        });

        setIsDialogOpen(false);
        setNewFriendName("");
        setNewFriendEmail("");
        setNewFriendPhone("");
    };

    // Calculate net balances and filter
    const balances = friends
        .filter(f => {
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            return f.name.toLowerCase().includes(q) || (f.phoneNumber && f.phoneNumber.includes(q));
        })
        .map(f => {
            const txs = splitRequests.filter(r => r.friendId === f.id || r.requesterId === f.id);
            let owedByFriend = 0;
            let owedToFriend = 0;
            txs.forEach(r => {
                if (r.status === 'paid') return;
                if (r.friendId === f.id) {
                    owedByFriend += r.amountOwed;
                } else {
                    owedToFriend += r.amountOwed;
                }
            });
            const net = owedByFriend - owedToFriend;
            return { ...f, net, owedByFriend, owedToFriend };
        });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Friends</h1>
                    <p className="text-muted-foreground">Keep track of your squad.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="lg" className="rounded-full shadow-lg">
                            <Plus className="mr-2 h-4 w-4" /> Add Friend
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add a Friend</DialogTitle>
                            <DialogDescription>
                                Add someone to your Slice network to split bills and send cash.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. Sarah Jones"
                                    value={newFriendName}
                                    onChange={(e) => setNewFriendName(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email (Optional)</Label>
                                <Input
                                    id="email"
                                    placeholder="sarah@example.com"
                                    value={newFriendEmail}
                                    onChange={(e) => setNewFriendEmail(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Phone Number (Optional)</Label>
                                <Input
                                    id="phone"
                                    placeholder="555-0123"
                                    value={newFriendPhone}
                                    onChange={(e) => setNewFriendPhone(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleAddFriend}>Add Friend</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex items-center gap-4 bg-background p-1 rounded-xl border max-w-md">
                <Search className="w-5 h-5 ml-3 text-muted-foreground" />
                <Input
                    placeholder="Search friends by name or phone..."
                    className="border-0 focus-visible:ring-0"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <Dialog open={!!selectedFriend} onOpenChange={(open) => !open && setSelectedFriend(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>History with {selectedFriend?.name}</DialogTitle>
                        <DialogDescription>Past transactions and splits.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                        {selectedFriend && splitRequests
                            .filter(r => r.friendId === selectedFriend.id || r.requesterId === selectedFriend.id)
                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                            .map(req => {
                                const tx = transactions.find(t => t.id === req.transactionId);
                                const isOwedByFriend = req.friendId === selectedFriend.id;
                                const isPaid = req.status === 'paid';

                                return (
                                    <div key={req.id} className="flex justify-between items-center border-b pb-2 last:border-0">
                                        <div>
                                            <div className="font-medium">{tx?.merchant_name || 'Unknown Transaction'}</div>
                                            <div className="text-xs text-muted-foreground">{new Date(req.createdAt).toLocaleDateString()}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`font-bold ${isPaid ? 'text-muted-foreground line-through' : (isOwedByFriend ? 'text-green-600' : 'text-red-600')}`}>
                                                {isOwedByFriend ? '+' : '-'}${req.amountOwed.toFixed(2)}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {isPaid ? 'Settled' : (isOwedByFriend ? 'They owe' : 'You owe')}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        }
                        {selectedFriend && splitRequests.filter(r => r.friendId === selectedFriend.id || r.requesterId === selectedFriend.id).length === 0 && (
                            <p className="text-center text-muted-foreground py-4">No history yet.</p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {balances.map(friend => (
                    <Card key={friend.id} className="group hover:border-primary/50 transition-all hover:shadow-md cursor-pointer" onClick={() => setSelectedFriend(friend)}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                                <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-purple-400 text-white font-bold">
                                    {friend.avatarInitials}
                                </AvatarFallback>
                            </Avatar>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive hover:bg-destructive/10"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm(`Are you sure you want to remove ${friend.name}?`)) {
                                        removeFriend(friend.id);
                                    }
                                }}
                            >
                                <Trash2 className="w-5 h-5" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <CardTitle className="text-lg mb-1">{friend.name}</CardTitle>
                            <div className="space-y-3 mt-4">
                                {friend.owedToFriend > 0 && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">You owe</span>
                                        <span className="font-bold text-red-600">-${friend.owedToFriend.toFixed(2)}</span>
                                    </div>
                                )}
                                {friend.owedByFriend > 0 && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Owes you</span>
                                        <span className="font-bold text-green-600">+${friend.owedByFriend.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="pt-2 border-t flex items-center justify-between">
                                    <span className="text-xs font-semibold uppercase text-muted-foreground">Net</span>
                                    <span className={`font-black ${friend.net >= 0 ? "text-green-600" : "text-red-600"}`}>
                                        {friend.net >= 0 ? '+' : '-'}${Math.abs(friend.net).toFixed(2)}
                                    </span>
                                </div>
                                <div className="pt-2">
                                    {friend.net < 0 && (
                                        <Button
                                            className="w-full bg-red-600 hover:bg-red-700 text-white"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm(`Are you sure you want to settle your balance of $${Math.abs(friend.net).toFixed(2)} with ${friend.name}?`)) {
                                                    // Logic to settle would go here (e.g., mark splits as paid)
                                                    // For MVP, just alert
                                                    alert(`Settled $${Math.abs(friend.net).toFixed(2)} with ${friend.name}!`);
                                                }
                                            }}
                                        >
                                            Settle Up
                                        </Button>
                                    )}
                                    {friend.net > 0 && (
                                        <Button
                                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                alert(`Request sent to ${friend.name} for $${friend.net.toFixed(2)}!`);
                                            }}
                                        >
                                            Request Payment
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {/* Add Friend Card Placeholder */}
                <Card
                    className="border-dashed flex flex-col items-center justify-center text-center p-6 text-muted-foreground hover:bg-muted/50 cursor-pointer transition-colors h-full min-h-[180px]"
                    onClick={() => setIsDialogOpen(true)}
                >
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                        <Plus className="w-6 h-6" />
                    </div>
                    <div className="font-medium">Invite a new friend</div>
                    <div className="text-xs mt-1">Add them to your network</div>
                </Card>
            </div>
        </div>
    );
}
