import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = 'http://api.nessieisreal.com';

export async function GET() {
    const apiKey = process.env.NESSIE_API_KEY;

    if (!apiKey) {
        return NextResponse.json(
            { error: 'Server configuration error: NESSIE_API_KEY is missing' },
            { status: 500 }
        );
    }

    try {
        const response = await fetch(`${BASE_URL}/customers?key=${apiKey}`);

        if (!response.ok) {
            throw new Error(`Nessie API error: ${response.statusText}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching customers:', error);
        return NextResponse.json(
            { error: 'Failed to fetch customers from Nessie' },
            { status: 500 }
        );
    }
}
