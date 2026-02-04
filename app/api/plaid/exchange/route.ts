
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/currentUser';
import { plaidClient } from '@/lib/plaid';
import prisma from '@/lib/prisma';
import { encryptToken } from '@/lib/crypto';
import { AccountsGetRequest } from 'plaid';

export async function POST(request: NextRequest) {
    try {
        const user = await requireUser();
        const body = await request.json();
        const { public_token } = body;

        if (!public_token) {
            return NextResponse.json({ error: 'Missing public_token' }, { status: 400 });
        }

        // Exchange public token for access token
        const exchangeResponse = await plaidClient.itemPublicTokenExchange({
            public_token,
        });

        const { access_token, item_id } = exchangeResponse.data;

        // Encrypt access token
        const { ciphertext, iv, tag } = encryptToken(access_token);

        // Store BankConnection
        // Check if institution info is available via generic call or from accounts
        // For now we will fetch accounts immediately.

        // Fetch accounts to get institution info and account details
        const accountsResponse = await plaidClient.accountsGet({
            access_token,
        });

        const accountsData = accountsResponse.data;
        const institutionId = accountsData.item.institution_id;
        let institutionName = '';

        if (institutionId) {
            try {
                const instRes = await plaidClient.institutionsGetById({
                    institution_id: institutionId,
                    country_codes: (process.env.PLAID_COUNTRY_CODES || 'US').split(',') as any,
                });
                institutionName = instRes.data.institution.name;
            } catch (e) {
                console.error("Failed to fetch institution details", e);
                institutionName = "Unknown Bank";
            }
        }

        // Upsert BankConnection
        const connection = await prisma.bankConnection.upsert({
            where: { plaidItemId: item_id },
            update: {
                accessTokenCiphertext: ciphertext,
                accessTokenIv: iv,
                accessTokenTag: tag,
                status: 'active',
                institutionId,
                institutionName,
                lastSyncAt: new Date(),
            },
            create: {
                userId: user.id,
                plaidItemId: item_id,
                accessTokenCiphertext: ciphertext,
                accessTokenIv: iv,
                accessTokenTag: tag,
                status: 'active',
                institutionId,
                institutionName,
                lastSyncAt: new Date(),
            },
        });

        // Upsert Accounts
        for (const acc of accountsData.accounts) {
            await prisma.bankAccount.upsert({
                where: { plaidAccountId: acc.account_id },
                update: {
                    name: acc.name,
                    mask: acc.mask,
                    type: acc.type,
                    subtype: acc.subtype,
                    currentBalance: acc.balances.current,
                    availableBalance: acc.balances.available,
                    isoCurrencyCode: acc.balances.iso_currency_code,
                },
                create: {
                    userId: user.id,
                    bankConnectionId: connection.id,
                    plaidAccountId: acc.account_id,
                    name: acc.name,
                    mask: acc.mask,
                    type: acc.type,
                    subtype: acc.subtype,
                    currentBalance: acc.balances.current,
                    availableBalance: acc.balances.available,
                    isoCurrencyCode: acc.balances.iso_currency_code,
                }
            });
        }

        // Ensure TransactionCursor exists
        await prisma.transactionCursor.upsert({
            where: { bankConnectionId: connection.id },
            update: {},
            create: {
                bankConnectionId: connection.id,
            }
        });

        return NextResponse.json({
            success: true,
            institutionName,
            accountsCount: accountsData.accounts.length
        });

    } catch (error) {
        console.error('Error exchanging public token:', error);
        return NextResponse.json({ error: 'Token exchange failed' }, { status: 500 });
    }
}
