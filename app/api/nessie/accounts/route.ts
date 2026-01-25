import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = 'http://api.nessieisreal.com';

export async function GET(request: NextRequest) {
    const apiKey = process.env.NESSIE_API_KEY;
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customerId');
    const debug = searchParams.get('debug') === '1';

    if (!apiKey) {
        return NextResponse.json(
            { error: 'Server configuration error: NESSIE_API_KEY is missing' },
            { status: 500 }
        );
    }

    if (!customerId) {
        return NextResponse.json(
            { error: 'Missing customerId query parameter' },
            { status: 400 }
        );
    }

    try {
        const response = await fetch(`${BASE_URL}/customers/${customerId}/accounts?key=${apiKey}`);

        if (!response.ok) {
            console.error(`Nessie API error (accounts): ${response.status} ${response.statusText}`);
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
        console.error('Error fetching accounts:', error);
        return NextResponse.json(
            { error: 'Failed to fetch accounts from Nessie' },
            { status: 500 }
        );
    }
}
