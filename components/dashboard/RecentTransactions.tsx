'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStore } from '@/lib/store';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';

export function RecentTransactions() {
    const { transactions } = useStore();
    const recent = transactions.slice(0, 5);

    return (
        <Card className="col-span-2">
            <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Merchant</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {recent.map((tx) => (
                            <TableRow key={tx.id}>
                                <TableCell className="font-medium">
                                    {format(parseISO(tx.date), 'MMM d')}
                                </TableCell>
                                <TableCell>{tx.merchant_name}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">{tx.category}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    ${tx.amount.toFixed(2)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
