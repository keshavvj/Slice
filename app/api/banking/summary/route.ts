
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/currentUser';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const user = await requireUser();

        const connections = await prisma.bankConnection.findMany({
            where: { userId: user.id },
            include: { accounts: true }
        });

        const accounts = connections.flatMap(c => c.accounts);

        // Calculate total balance (depository only for now, or net worth)
        // For "checkingBalance" equivalent, maybe specifically look for checking/savingssubtype
        const checkingAccounts = accounts.filter(a => a.subtype === 'checking' || a.type === 'depository');
        const totalBalance = checkingAccounts.reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);

        return NextResponse.json({
            connections: connections.map(c => ({
                id: c.id,
                institutionName: c.institutionName,
                status: c.status,
                lastSyncAt: c.lastSyncAt,
                accounts: c.accounts.map(a => ({
                    id: a.id,
                    name: a.name,
                    mask: a.mask,
                    type: a.type,
                    subtype: a.subtype,
                    balance: a.currentBalance,
                }))
            })),
            totalBalance,
            accountsCount: accounts.length
        });

    } catch (error) {
        console.error('Error fetching banking summary:', error);
        return NextResponse.json({ error: 'Failed to fetch summary' }, { status: 500 });
    }
}
