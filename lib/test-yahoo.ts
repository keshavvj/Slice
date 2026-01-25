
const symbols = ["AAPL", "BTC-USD"];

async function testYahoo() {
    for (const symbol of symbols) {
        try {
            const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1mo&interval=1d`);
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ Yahoo fetch success for ${symbol}:`, data.chart.result[0].meta.symbol);
            } else {
                console.error(`❌ Yahoo fetch failed for ${symbol}: ${response.status}`);
            }
        } catch (error) {
            console.error(`❌ Yahoo fetch error for ${symbol}:`, error);
        }
    }
}

testYahoo();
