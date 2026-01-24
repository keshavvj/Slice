'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStore } from '@/lib/store';
import { detectSmartSplits } from '@/lib/logic';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
// Setup a simple split dialog later or inline for MVP

export default function SplitsPage() {
    const { transactions, splitRequests, friends, createSplitRequest, markSplitPaid, checkAutoSplits } = useStore();

    // Smart Split suggestions
    const [suggestions, setSuggestions] = React.useState<string[]>([]);

    React.useEffect(() => {
        // Run detection logic
        const detected = detectSmartSplits(transactions, splitRequests);
        setSuggestions(detected);
    }, [transactions, splitRequests]);

    const handleCreateSplit = () => {
        // Mock creating a split for the last transaction
        // In real app, open dialog to select tx and amount
        const tx = transactions[0];
        createSplitRequest({
            id: `sr_${Date.now()}`,
            transactionId: tx.id,
            requesterId: 'u_123',
            friendId: friends[0].id,
            totalAmount: tx.amount,
            amountOwed: tx.amount / 2,
            status: 'pending',
            createdAt: new Date().toISOString()
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Splits</h1>
                <Button onClick={handleCreateSplit}>New Split</Button>
            </div>

            {suggestions.length > 0 && (
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader>
                        <CardTitle className="text-primary flex items-center">
                            Smart Split Suggestions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-balance">
                            We noticed you frequently split <strong>{suggestions.join(", ")}</strong>.
                            Want to auto-slice future charges?
                        </p>
                        <Button variant="secondary" size="sm" className="mt-2">Enable Auto-Slice</Button>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Pending Requests</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Friend</TableHead>
                                <TableHead>Details</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {splitRequests.map(req => {
                                const friend = friends.find(f => f.id === req.friendId);
                                return (
                                    <TableRow key={req.id}>
                                        <TableCell>{friend?.name || 'Unknown'}</TableCell>
                                        <TableCell className="text-muted-foreground text-xs">
                                            {new Date(req.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="font-medium">${req.amountOwed.toFixed(2)}</TableCell>
                                        <TableCell>
                                            <Badge variant={req.status === 'paid' ? 'secondary' : 'default'} className={req.status === 'paid' ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}>
                                                {req.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {req.status === 'pending' && req.friendId !== 'u_123' && (
                                                <Button size="sm" variant="ghost" onClick={() => markSplitPaid(req.id)}>
                                                    Mark Paid
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
