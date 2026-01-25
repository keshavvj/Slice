
import { FinnhubCandles } from "@/lib/finnhub";

export function generateMockCandles(symbol: string, days: number = 30): FinnhubCandles {
    const end = Math.floor(Date.now() / 1000);
    const start = end - (days * 24 * 60 * 60);
    const count = days; // One candle per day for simplicity

    const c: number[] = [];
    const h: number[] = [];
    const l: number[] = [];
    const o: number[] = [];
    const t: number[] = [];
    const v: number[] = [];

    // Seed price based on symbol
    let price = 150;
    if (symbol === "AAPL") price = 180;
    if (symbol === "MSFT") price = 400;
    if (symbol === "SPY") price = 500;
    if (symbol.includes("BTC")) price = 65000;

    for (let i = 0; i < count; i++) {
        const time = start + (i * 24 * 60 * 60);
        t.push(time);

        const volatility = price * 0.02; // 2% daily volatility
        const change = (Math.random() - 0.5) * volatility;

        const open = price;
        const close = price + change;
        const high = Math.max(open, close) + (Math.random() * volatility * 0.5);
        const low = Math.min(open, close) - (Math.random() * volatility * 0.5);

        o.push(Number(open.toFixed(2)));
        c.push(Number(close.toFixed(2)));
        h.push(Number(high.toFixed(2)));
        l.push(Number(low.toFixed(2)));
        v.push(Math.floor(Math.random() * 1000000));

        price = close;
    }

    return {
        c, h, l, o, t, v,
        s: "ok"
    };
}
