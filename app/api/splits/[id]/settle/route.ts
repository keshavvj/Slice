
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/currentUser';
import prisma from '@/lib/prisma';

type Props = {
    params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: Props) {
    try {
        const user = await requireUser();
        const { id } = await params;

        // Verify authorized to settle (must be payer or payee?)
        // Usually, the person who OWED money (receiver of original request) marks it as settled?
        // Or the person who needs to receive money marks it as settled (confirmed receipt).
        // Let's assume the Receiver (Creditor) marks it as Succeeded/Paid.
        // Original Request: fromUser (Creditor), toUser (Debtor).
        // So `fromUser` should settle it? "I received the money".
        // OR `toUser` says "I paid".
        // Let's allow either for now, typically "Settle Up" in apps like Splitwise is bi-directional confirmation or just one-sided.
        // For MVP: Let anyone involved settle it.
        // Actually, safer if the person receiving money (fromUser) confirms.
        // But in this app flow, "Settle" might just mean "Clear the debt".
        // Let's check `lib/store.ts` settle logic. It creates a transaction "Paid Friend".
        // Typically user clicks "Settle" -> sends money -> marks as paid.

        const split = await prisma.splitRequest.findUnique({
            where: { id }
        });

        if (!split) {
            return NextResponse.json({ error: 'Split request not found' }, { status: 404 });
        }

        if (split.fromUserId !== user.id && split.toUserId !== user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const updated = await prisma.splitRequest.update({
            where: { id },
            data: { status: 'paid' }
        });

        return NextResponse.json({ split: updated });

    } catch (error) {
        console.error('Error settling split:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
