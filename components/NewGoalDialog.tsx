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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';

export function NewGoalDialog() {
    const { addGoal, friends } = useStore();
    const [open, setOpen] = React.useState(false);
    const [name, setName] = React.useState('');
    const [targetAmount, setTargetAmount] = React.useState('');
    const [selectedFriendId, setSelectedFriendId] = React.useState<string>('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const friend = friends.find(f => f.id === selectedFriendId);

        const newGoal: SharedGoal = {
            id: `goal_${Date.now()}`,
            name,
            targetAmount: Number(targetAmount),
            currentAmount: 0,
            weeklyContribution: 0,
            members: friend ? [friend] : [],
            contributions: []
        };

        addGoal(newGoal);
        setOpen(false);
        setName('');
        setTargetAmount('');
        setSelectedFriendId('');
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
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="friends" className="text-right">
                                Invite
                            </Label>
                            <Select onValueChange={setSelectedFriendId} value={selectedFriendId}>
                                <SelectTrigger className="w-[180px] col-span-3 w-full">
                                    <SelectValue placeholder="Select a friend" />
                                </SelectTrigger>
                                <SelectContent>
                                    {friends.map(friend => (
                                        <SelectItem key={friend.id} value={friend.id}>
                                            {friend.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
