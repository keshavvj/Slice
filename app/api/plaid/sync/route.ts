
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/currentUser';
import { plaidClient } from '@/lib/plaid';
import prisma from '@/lib/prisma';
import { decryptToken } from '@/lib/crypto';
import { RemovedTransaction, Transaction as PlaidTransaction, TransactionsSyncRequest } from 'plaid';

export async function POST(request: NextRequest) {
    try {
        const user = await requireUser();

        // Optional: sync specific connection
        const body = await request.json().catch(() => ({}));
        const { connectionId } = body;

        const where: any = {
            userId: user.id,
            status: 'active'
        };
        if (connectionId) {
            where.id = connectionId;
        }

        const connections = await prisma.bankConnection.findMany({
            where,
            include: {
                transactionCursor: true,
            }
        });

        let totalAdded = 0;
        let totalModified = 0;
        let totalRemoved = 0;

        for (const connection of connections) {
            try {
                const accessToken = decryptToken(
                    connection.accessTokenCiphertext,
                    connection.accessTokenIv,
                    connection.accessTokenTag
                );

                let cursor = connection.transactionCursor?.cursor || undefined;
                let hasMore = true;
                let added: PlaidTransaction[] = [];
                let modified: PlaidTransaction[] = [];
                let removed: RemovedTransaction[] = [];

                // 1. Sync Transactions
                while (hasMore) {
                    const req: TransactionsSyncRequest = {
                        access_token: accessToken,
                        cursor,
                        count: 500, // Max per page
                    };
                    const response = await plaidClient.transactionsSync(req);
                    const data = response.data;

                    added = [...added, ...data.added];
                    modified = [...modified, ...data.modified];
                    removed = [...removed, ...data.removed];
                    hasMore = data.has_more;
                    cursor = data.next_cursor;
                }

                // 2. Process updates in DB

                // Added
                for (const tx of added) {
                    // Find account for this transaction (it might be a new account? unlikely if we synced accounts first, but possible)
                    // We should check if account exists in our DB, if not we might skip or auto-create. 
                    // For simplicity, we assume account exists or we skip.
                    const account = await prisma.bankAccount.findUnique({
                        where: { plaidAccountId: tx.account_id }
                    });

                    if (account) {
                        await prisma.transaction.upsert({
                            where: { plaidTransactionId: tx.transaction_id },
                            update: {
                                name: tx.name,
                                merchantName: tx.merchant_name,
                                amount: tx.amount,
                                categoryPrimary: tx.category ? tx.category[0] : null,
                                categoryDetailed: tx.category && tx.category.length > 1 ? tx.category[1] : null,
                                pending: tx.pending,
                                paymentChannel: tx.payment_channel,
                            },
                            create: {
                                userId: user.id,
                                bankAccountId: account.id,
                                plaidTransactionId: tx.transaction_id,
                                name: tx.name,
                                merchantName: tx.merchant_name,
                                amount: tx.amount,
                                isoCurrencyCode: tx.iso_currency_code,
                                date: new Date(tx.date),
                                authorizedDate: tx.authorized_date ? new Date(tx.authorized_date) : null,
                                categoryPrimary: tx.category ? tx.category[0] : null,
                                categoryDetailed: tx.category && tx.category.length > 1 ? tx.category[1] : null,
                                pending: tx.pending,
                                paymentChannel: tx.payment_channel,
                            }
                        });
                        totalAdded++;
                    }
                }

                // Modified
                for (const tx of modified) {
                    await prisma.transaction.updateMany({
                        where: { plaidTransactionId: tx.transaction_id },
                        data: {
                            name: tx.name,
                            merchantName: tx.merchant_name,
                            amount: tx.amount,
                            pending: tx.pending,
                            categoryPrimary: tx.category ? tx.category[0] : null,
                            categoryDetailed: tx.category && tx.category.length > 1 ? tx.category[1] : null,
                        }
                    });
                    totalModified++;
                }

                // Removed
                for (const tx of removed) {
                    await prisma.transaction.deleteMany({
                        where: { plaidTransactionId: tx.transaction_id }
                    });
                    totalRemoved++;
                }

                // 3. Update Cursor
                if (cursor) {
                    await prisma.transactionCursor.upsert({
                        where: { bankConnectionId: connection.id },
                        update: { cursor, lastSyncAt: new Date() },
                        create: { bankConnectionId: connection.id, cursor, lastSyncAt: new Date() }
                    });
                }

                // 4. Update Balances
                const balanceResponse = await plaidClient.accountsBalanceGet({ access_token: accessToken });
                for (const acc of balanceResponse.data.accounts) {
                    await prisma.bankAccount.updateMany({
                        where: { plaidAccountId: acc.account_id },
                        data: {
                            currentBalance: acc.balances.current,
                            availableBalance: acc.balances.available,
                        }
                    });
                }

                // Update connection lastSyncAt
                await prisma.bankConnection.update({
                    where: { id: connection.id },
                    data: { lastSyncAt: new Date() }
                });

            } catch (err) {
                console.error(`Failed to sync connection ${connection.id}`, err);
                // Optionally update status to error
                await prisma.bankConnection.update({
                    where: { id: connection.id },
                    data: { status: 'error' }
                });
            }
        }

        return NextResponse.json({
            success: true,
            added: totalAdded,
            modified: totalModified,
            removed: totalRemoved
        });

    } catch (error) {
        console.error('Error syncing transactions:', error);
        return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
    }
}
