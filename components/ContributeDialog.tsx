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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from '@/lib/store';

interface ContributeDialogProps {
    goalId: string;
    goalName: string;
}

export function ContributeDialog({ goalId, goalName }: ContributeDialogProps) {
    const { contributeToGoal, user, goals } = useStore();
    const [open, setOpen] = React.useState(false);
    const [amount, setAmount] = React.useState('');
    const [memberId, setMemberId] = React.useState(user.id);

    const goal = goals.find(g => g.id === goalId);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = Number(amount);
        if (numAmount > 0) {
            contributeToGoal(goalId, numAmount, memberId);
            setOpen(false);
            setAmount('');
            setMemberId(user.id);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Contribute</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Contribute to {goalName}</DialogTitle>
                    <DialogDescription>
                        Add funds to this shared goal.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="amount" className="text-right">
                                Amount ($)
                            </Label>
                            <Input
                                id="amount"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="50"
                                className="col-span-3"
                                required
                                min="1"
                                autoFocus
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="member" className="text-right">
                                Member
                            </Label>
                            <div className="col-span-3">
                                <Select value={memberId} onValueChange={setMemberId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select member" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={user.id}>Me ({user.name})</SelectItem>
                                        {goal?.members.map(m => (
                                            <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit">Confirm Contribution</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
