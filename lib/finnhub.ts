
export interface FinnhubQuote {
    c: number; // Current price
    d: number; // Change
    dp: number; // Percent change
    h: number; // High price of the day
    l: number; // Low price of the day
    o: number; // Open price of the day
    pc: number; // Previous close price
    t: number; // Timestamp
}

export interface FinnhubCandles {
    c: number[];
    h: number[];
    l: number[];
    o: number[];
    s: string;
    t: number[];
    v: number[];
}


const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

export async function fetchQuote(symbol: string): Promise<FinnhubQuote | null> {
    if (!FINNHUB_API_KEY) {
        console.error("FINNHUB_API_KEY is not set");
        return null;
    }

    try {
        const response = await fetch(
            `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`,
            { next: { revalidate: 60 } } // Cache for 60 seconds
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch quote for ${symbol}: ${response.statusText}`);
        }

        const data = await response.json();
        return data as FinnhubQuote;
    } catch (error) {
        console.error("Error fetching Finnhub data:", error);
        return null;
    }
}
