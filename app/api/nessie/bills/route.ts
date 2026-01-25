import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = 'http://api.nessieisreal.com';

export async function GET(request: NextRequest) {
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
        const response = await fetch(`${BASE_URL}/accounts/${accountId}/bills?key=${apiKey}`);

        if (!response.ok) {
            throw new Error(`Nessie API error: ${response.statusText}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching bills:', error);
        return NextResponse.json(
            { error: 'Failed to fetch bills from Nessie' },
            { status: 500 }
        );
    }
}
