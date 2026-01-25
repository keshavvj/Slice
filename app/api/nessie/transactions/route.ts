import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = 'http://api.nessieisreal.com';

export async function GET(request: NextRequest) {
    const apiKey = process.env.NESSIE_API_KEY;
    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get('accountId');
    const debug = searchParams.get('debug') === '1';

    if (!apiKey) {
        return NextResponse.json(
            { error: 'Server configuration error: NESSIE_API_KEY is missing' },
            { status: 500 }
        );
    }

    if (!accountId) {
        return NextResponse.json(
            { error: 'Missing accountId query parameter' },
            { status: 400 }
        );
    }

    try {
        const response = await fetch(`${BASE_URL}/accounts/${accountId}/purchases?key=${apiKey}`);

        if (!response.ok) {
            console.error(`Nessie API error (transactions): ${response.status} ${response.statusText}`);
            throw new Error(`Nessie API error: ${response.statusText}`);
        }

        const data = await response.json();

        if (debug) {
            return NextResponse.json({
                ok: true,
                data,
                sample: Array.isArray(data) ? data.slice(0, 2) : data
            });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch transactions from Nessie' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    const apiKey = process.env.NESSIE_API_KEY;
    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get('accountId');

    if (!apiKey) {
        return NextResponse.json(
            { error: 'Server configuration error: NESSIE_API_KEY is missing' },
            { status: 500 }
        );
    }

    if (!accountId) {
        return NextResponse.json(
            { error: 'Missing accountId query parameter' },
            { status: 400 }
        );
    }

    try {
        const body = await request.json();
        console.log('[API Proxy] Creating Purchase Payload:', JSON.stringify(body, null, 2));

        // Forward to Nessie
        const response = await fetch(`${BASE_URL}/accounts/${accountId}/purchases?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Nessie API error (create purchase): ${response.status} ${errorText}`);
            return NextResponse.json(
                { error: `Nessie API error: ${errorText}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data, { status: 201 });

    } catch (error) {
        console.error('Error creating transaction:', error);
        return NextResponse.json(
            { error: 'Failed to create transaction in Nessie' },
            { status: 500 }
        );
    }
}
