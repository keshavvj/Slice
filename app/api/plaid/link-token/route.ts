
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/currentUser';
import { plaidClient } from '@/lib/plaid';
import { CountryCode, Products, LinkTokenCreateRequest } from 'plaid';

export async function POST(request: NextRequest) {
    try {
        const user = await requireUser();

        const requestBody: LinkTokenCreateRequest = {
            user: {
                client_user_id: user.id,
            },
            client_name: 'Slice',
            products: ['transactions'], // Simplify to just transactions to avoid flow conflicts
            // products: (process.env.PLAID_PRODUCTS || 'transactions').split(',') as Products[],
            country_codes: (process.env.PLAID_COUNTRY_CODES || 'US').split(',') as CountryCode[],
            language: 'en',
        };

        const createTokenResponse = await plaidClient.linkTokenCreate(requestBody);

        return NextResponse.json(createTokenResponse.data);
    } catch (error: any) {
        console.error('Error creating link token:', error.response?.data || error.message || error);
        return NextResponse.json({ error: 'Failed to create link token' }, { status: 500 });
    }
}
