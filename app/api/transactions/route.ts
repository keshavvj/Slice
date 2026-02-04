
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/currentUser';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const user = await requireUser();

        const transactions = await prisma.transaction.findMany({
            where: { userId: user.id },
            orderBy: { date: 'desc' },
            take: 50,
            include: {
                account: true
            }
        });

        return NextResponse.json({
            transactions: transactions.map(t => ({
                id: t.id,
                plaidTransactionId: t.plaidTransactionId,
                name: t.name,
                merchantName: t.merchantName,
                amount: t.amount,
                date: t.date,
                category: t.categoryPrimary,
                pending: t.pending,
                accountName: t.account.name,
                accountMask: t.account.mask,
            }))
        });

    } catch (error) {
        console.error('Error fetching transactions:', error);
        return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }
}
