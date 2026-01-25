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

interface ContributeDialogProps {
    goalId: string;
    goalName: string;
}

export function ContributeDialog({ goalId, goalName }: ContributeDialogProps) {
    const { contributeToGoal } = useStore();
    const [open, setOpen] = React.useState(false);
    const [amount, setAmount] = React.useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = Number(amount);
        if (numAmount > 0) {
            contributeToGoal(goalId, numAmount);
            setOpen(false);
            setAmount('');
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">Contribute</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Contribute to {goalName}</DialogTitle>
                    <DialogDescription>
                        Enter the amount you want to contribute to this goal.
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
                    </div>
                    <DialogFooter>
                        <Button type="submit">Confirm Contribution</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
