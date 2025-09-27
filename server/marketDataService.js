const WebSocket = require('ws');
const db = require('./db');

let wss;

let marketData = {
    nifty50: { value: 18234.50, change: 0.28, history: [18234.50] },
    bsesensex: { value: 61789.80, change: 0.24, history: [61789.80] },
    niftybank: { value: 43500.00, change: 0.46, history: [43500.00] },
    niftyit: { value: 29000.00, change: 0.52, history: [29000.00] },
    niftypharma: { value: 13000.00, change: 0.39, history: [13000.00] },
    niftymidcap100: { value: 35000.00, change: 0.34, history: [35000.00] },
    niftysmallcap100: { value: 12000.00, change: 0.67, history: [12000.00] },
    nifty500: { value: 16000.00, change: 0.44, history: [16000.00] },
    indiavix: { value: 12.50, change: -3.85, history: [12.50] },
    niftyauto: { value: 15000.00, change: 0.67, history: [15000.00] },
    niftyfmcg: { value: 50000.00, change: 0.50, history: [50000.00] },
    niftymetal: { value: 6000.00, change: 0.50, history: [6000.00] },
    sp500: { value: 4500.00, change: 0.44, history: [4500.00] },
    nasdaq: { value: 15000.00, change: 0.67, history: [15000.00] },
    dowjones: { value: 35000.00, change: 0.29, history: [35000.00] },
    msciworld: { value: 3000.00, change: 0.50, history: [3000.00] },
    ftseallworld: { value: 400.00, change: 0.50, history: [400.00] },
    djglobaltitans50: { value: 300.00, change: 0.50, history: [300.00] },
    spglobal100: { value: 1500.00, change: 0.50, history: [1500.00] },
    spglobal1200: { value: 2000.00, change: 0.50, history: [2000.00] },
    gold: { value: 60000, change: 0.84, history: [60000] },
    silver: { value: 70000, change: 1.45, history: [70000] },
    crudeoil: { value: 80.00, change: 1.91, history: [80.00] },
    naturalgas: { value: 3.00, change: 1.69, history: [3.00] },
    copper: { value: 4.00, change: 0.50, history: [4.00] },
    aluminium: { value: 2500, change: 0.40, history: [2500] },
    zinc: { value: 3000, change: 0.50, history: [3000] },
    lead: { value: 2000, change: 0.40, history: [2000] },
    nickel: { value: 20000, change: 0.50, history: [20000] },
    cotton: { value: 90.00, change: 0.56, history: [90.00] },
    avax: { value: 30.00, change: 5.26, history: [30.00] },
    btc: { value: 60000.00, change: 2.04, history: [60000.00] },
    eth: { value: 3500.00, change: 2.04, history: [3500.00] },
    xrp: { value: 0.50, change: 4.17, history: [0.50] },
    ltc: { value: 70.00, change: 2.94, history: [70.00] },
    ada: { value: 0.40, change: 2.56, history: [0.40] },
    sol: { value: 150.00, change: 3.45, history: [150.00] },
    doge: { value: 0.15, change: 3.45, history: [0.15] },
    shib: { value: 0.00001, change: 5.26, history: [0.00001] },
    tcs: { value: 3300.50, change: 0.31, history: [3300.50] },
    reliance: { value: 2500.00, change: -0.22, history: [2500.00] },
    hdfcbank: { value: 1600.75, change: 0.13, history: [1600.75] },
    infosys: { value: 1500.20, change: 0.60, history: [1500.20] },
    icicibank: { value: 900.00, change: -0.17, history: [900.00] },
    sbi: { value: 600.50, change: 0.54, history: [600.50] },
    bhartiairtel: { value: 800.00, change: -0.25, history: [800.00] },
    itc: { value: 450.75, change: 0.24, history: [450.75] },
    lnt: { value: 2200.00, change: 0.69, history: [2200.00] },
    asianpaints: { value: 3000.50, change: -0.33, history: [3000.50] },
    tatamotors: { value: 450.00, change: 1.12, history: [450.00] },
    marutisuzuki: { value: 9000.00, change: -0.22, history: [9000.00] },
    hul: { value: 2500.00, change: 0.40, history: [2500.00] },
    bajajfinance: { value: 7000.00, change: -0.21, history: [7000.00] },
    nestleindia: { value: 20000.00, change: 0.25, history: [20000.00] },
    wipro: { value: 400.00, change: 1.27, history: [400.00] }
};

function broadcast(data) {
  if (wss) {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }
}

function simulateMarketChanges() {
    for (const key in marketData) {
        let item = marketData[key];

        const drift = 0.00001; 
        const volatility = 0.001; 
        const randomFactor = volatility * (Math.random() - 0.5) * 2; 
        
        const newPrice = item.value * Math.exp(drift + randomFactor);
        const newChange = ((newPrice - item.value) / item.value) * 100;
        
        item.value = newPrice;
        item.change = newChange;

        if (item.history) {
            item.history.push(newPrice);
            if (item.history.length > 20) { 
                item.history.shift();
            }
        }
    }
    broadcast(marketData);

    db.getAllAlerts((err, alerts) => {
        if (err) {
            console.error('Error fetching alerts:', err);
            return;
        }

        alerts.forEach(alert => {
            const asset = marketData[alert.asset_id.toLowerCase()];
            if (asset) {
                if (alert.condition === 'above' && asset.value > alert.target_price) {
                    console.log(`ALERT: ${alert.asset_id} is above ${alert.target_price}. Current price: ${asset.value}`);
                    // In a real application, you would send a notification to the user here.
                } else if (alert.condition === 'below' && asset.value < alert.target_price) {
                    console.log(`ALERT: ${alert.asset_id} is below ${alert.target_price}. Current price: ${asset.value}`);
                    // In a real application, you would send a notification to the user here.
                }
            }
        });
    });
}

function initMarketDataService(server) {
    wss = new WebSocket.Server({ server });

    wss.on('connection', ws => {
        console.log('Client connected to market data WebSocket');
        // Send initial data on connection
        ws.send(JSON.stringify(marketData));
        ws.on('close', () => {
            console.log('Client disconnected from market data WebSocket');
        });
    });

    setInterval(simulateMarketChanges, 3000); // Simulate changes every 3 seconds
}

module.exports = { initMarketDataService };