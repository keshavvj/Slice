'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStore } from '@/lib/store';
import { SharedGoal } from '@/types';
import { Check, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';

export function NewGoalDialog() {
    const { addGoal } = useStore(); // Don't use store friends, fetch fresh list
    const [open, setOpen] = React.useState(false);
    const [name, setName] = React.useState('');
    const [targetAmount, setTargetAmount] = React.useState('');
    const [selectedFriendIds, setSelectedFriendIds] = React.useState<string[]>([]);
    const [availableFriends, setAvailableFriends] = React.useState<any[]>([]);

    React.useEffect(() => {
        if (open) {
            const fetchFriends = async () => {
                try {
                    const res = await fetch('/api/friends');
                    if (res.ok) {
                        const data = await res.json();
                        setAvailableFriends(data.friends || []);
                    }
                } catch (e) { console.error(e); }
            };
            fetchFriends();
        }
    }, [open]);

    const toggleFriend = (id: string) => {
        setSelectedFriendIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // We construct a SharedGoal to pass to addGoal
        // Note: addGoal now calls API which needs member IDs. 
        // We just need to conform to SharedGoal type for the store method sig, 
        // or we trust addGoal handles it.
        // Our updated addGoal takes { members: Friend[] ... } so we map back.

        const selectedFriends = availableFriends.filter(f => selectedFriendIds.includes(f.id)).map(f => ({
            id: f.id,
            name: f.displayName || f.handle || f.name,
            avatarInitials: (f.displayName || f.handle || f.name || 'U')[0].toUpperCase()
        }));

        const newGoal: SharedGoal = {
            id: `temp_${Date.now()}`, // will be replaced by API
            name,
            targetAmount: Number(targetAmount),
            currentAmount: 0,
            weeklyContribution: 0,
            members: selectedFriends,
            contributions: []
        };

        addGoal(newGoal);
        setOpen(false);
        setName('');
        setTargetAmount('');
        setSelectedFriendIds([]);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> New Goal
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create New Goal</DialogTitle>
                    <DialogDescription>
                        Set a target and invite friends to save together.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Goal
                            </Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="vacation, new car..."
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="amount" className="text-right">
                                Target ($)
                            </Label>
                            <Input
                                id="amount"
                                type="number"
                                value={targetAmount}
                                onChange={(e) => setTargetAmount(e.target.value)}
                                placeholder="5000"
                                className="col-span-3"
                                required
                                min="1"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label className="text-right pt-2">
                                Invite
                            </Label>
                            <div className="col-span-3 space-y-2">
                                <div className="max-h-[200px] overflow-y-auto border rounded-md p-2 space-y-1">
                                    {availableFriends.length === 0 ? (
                                        <p className="text-sm text-muted-foreground p-2">No friends yet. Add some in the Friends tab!</p>
                                    ) : (
                                        availableFriends.map(friend => {
                                            const isSelected = selectedFriendIds.includes(friend.id);
                                            const displayName = friend.displayName || friend.handle || friend.name;
                                            const initials = (displayName || 'U')[0].toUpperCase();

                                            return (
                                                <div
                                                    key={friend.id}
                                                    onClick={() => toggleFriend(friend.id)}
                                                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-primary/10 border-primary/20' : 'hover:bg-muted'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8 border">
                                                            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-sm font-medium">{displayName}</span>
                                                    </div>
                                                    {isSelected && <Check className="h-4 w-4 text-primary" />}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground text-right">
                                    {selectedFriendIds.length} friend{selectedFriendIds.length !== 1 && 's'} selected
                                </p>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit">Create Goal</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
