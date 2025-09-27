const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
    const envConfig = require('dotenv').parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

require('dotenv').config({ path: './.env' });

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const db = require('./db');

const app = express();
const port = 5000;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined.");
  process.exit(1);
}

app.use(cors({ origin: (origin, callback) => callback(null, true), credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Root endpoint
app.get('/', (req, res) => {
  res.send('Invest & Earn Corp backend server is running!');
});

const Png = require('captchapng');

app.get('/captcha', (req, res) => {
    const captchaText = parseInt(Math.random() * 9000 + 1000);
    const p = new Png(80, 30, captchaText);
    p.color(0, 0, 0, 0);
    p.color(80, 80, 80, 255);
    const img = p.getBase64();
    const imgbase64 = Buffer.from(img, 'base64');
    res.json({ success: true, captchaImage: `data:image/png;base64,${img}`, captchaText: captchaText.toString() });
});

// --- AUTHENTICATION ENDPOINTS ---

app.post('/register', async (req, res) => {
    const { mobile, email, password, captcha, generatedCaptcha } = req.body;
    if (!mobile || !email || !password || !captcha || !generatedCaptcha) {
        return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
    }

    console.log(`Registering user: ${mobile}, captcha from user: ${captcha}, generated captcha: ${generatedCaptcha}`);
    if (captcha !== generatedCaptcha) {
        return res.status(400).json({ success: false, message: 'Invalid CAPTCHA.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.createUser(mobile, email, hashedPassword, (err, user) => {
            if (err) {
                return res.status(400).json({ success: false, message: 'This mobile number or email is already registered.' });
            }
            const token = jwt.sign({ id: user.id, mobile: mobile }, JWT_SECRET, { expiresIn: '1h' });
            res.json({ success: true, message: 'Registration successful!', token: token });
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'An error occurred during registration.' });
    }
});

app.post('/logout', (req, res) => {
    res.json({ success: true, message: 'Logged out successfully.' });
});

app.post('/login', (req, res) => {
    const { mobile, password, captcha, generatedCaptcha } = req.body;
    if (!mobile || !password || !captcha || !generatedCaptcha) {
        return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
    }

    console.log(`Logging in user: ${mobile}, captcha from user: ${captcha}, generated captcha: ${generatedCaptcha}`);
    if (captcha !== generatedCaptcha) {
        return res.status(400).json({ success: false, message: 'Invalid CAPTCHA.' });
    }

    db.findUserByMobile(mobile, async (err, user) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'An error occurred during login.' });
        }
        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid credentials.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid credentials.' });
        }

        const token = jwt.sign({ id: user.id, mobile: user.mobile }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ success: true, message: 'Login successful!', token: token });
    });
});

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    console.log('authenticateToken: token from header', token);
    if (!token) {
        return res.sendStatus(401);
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error('authenticateToken: jwt.verify error', err);
            return res.sendStatus(403);
        }
        req.user = user;
        next();
    });
};

app.get('/dashboard', authenticateToken, (req, res) => {
    // In a real application, you would fetch this data from the database based on the user ID
    const portfolioData = {
        totalInvestment: 150000,
        currentValue: 175000,
        overallGainLoss: 25000,
        overallGainLossPercentage: 16.67,
        performanceData: [150000, 155000, 160000, 162000, 168000, 175000],
        performanceLabels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        recentActivity: [
            'Bought 10 shares of RELIANCE at ₹2,800',
            'Sold 5 shares of HDFCBANK at ₹1,500',
            'Invested ₹5,000 in Nifty 50 Index Fund',
            'Withdrew ₹10,000 from Liquid Fund'
        ]
    };
    res.json(portfolioData);
});

app.get('/portfolio', authenticateToken, (req, res) => {
    db.getPortfolio(req.user.id, (err, portfolio) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'An error occurred while fetching portfolio.' });
        }
        res.json({ success: true, portfolio });
    });
});

app.post('/portfolio', authenticateToken, (req, res) => {
    const { assetId, assetName, quantity, purchasePrice, purchaseDate } = req.body;
    if (!assetId || !assetName || !quantity || !purchasePrice || !purchaseDate) {
        return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
    }

    db.addAssetToPortfolio(req.user.id, assetId, assetName, quantity, purchasePrice, purchaseDate, (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'An error occurred while adding asset to portfolio.' });
        }
        res.json({ success: true, message: 'Asset added to portfolio successfully.', assetId: result.id });
    });
});

app.get('/watchlist', authenticateToken, (req, res) => {
    db.getWatchlist(req.user.id, (err, watchlist) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'An error occurred while fetching watchlist.' });
        }
        res.json({ success: true, watchlist });
    });
});

app.post('/watchlist', authenticateToken, (req, res) => {
    const { assetId, assetName } = req.body;
    if (!assetId || !assetName) {
        return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
    }

    db.addAssetToWatchlist(req.user.id, assetId, assetName, (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'An error occurred while adding asset to watchlist.' });
        }
        res.json({ success: true, message: 'Asset added to watchlist successfully.', assetId: result.id });
    });
});

app.delete('/watchlist/:assetId', authenticateToken, (req, res) => {
    const { assetId } = req.params;
    db.removeAssetFromWatchlist(req.user.id, assetId, (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'An error occurred while removing asset from watchlist.' });
        }
        if (result.changes === 0) {
            return res.status(404).json({ success: false, message: 'Asset not found in watchlist.' });
        }
        res.json({ success: true, message: 'Asset removed from watchlist successfully.' });
    });
});

app.post('/alerts', authenticateToken, (req, res) => {
    const { assetId, condition, targetPrice } = req.body;
    if (!assetId || !condition || !targetPrice) {
        return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
    }

    db.createAlert(req.user.id, assetId, condition, targetPrice, (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'An error occurred while creating the alert.' });
        }
        res.json({ success: true, message: 'Alert created successfully.', alertId: result.id });
    });
});

app.get('/alerts', authenticateToken, (req, res) => {
    db.getAlerts(req.user.id, (err, alerts) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'An error occurred while fetching alerts.' });
        }
        res.json({ success: true, alerts });
    });
});

app.delete('/alerts/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    db.deleteAlert(id, req.user.id, (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'An error occurred while deleting the alert.' });
        }
        if (result.changes === 0) {
            return res.status(404).json({ success: false, message: 'Alert not found.' });
        }
        res.json({ success: true, message: 'Alert deleted successfully.' });
    });
});

app.get('/sector-performance', authenticateToken, (req, res) => {
    const predictions = [
        { sector: 'Nifty Bank', performance: 'Outperform' },
        { sector: 'Nifty IT', performance: 'Neutral' },
        { sector: 'Nifty Pharma', performance: 'Underperform' },
        { sector: 'Nifty Auto', performance: 'Outperform' },
        { sector: 'Nifty FMCG', performance: 'Neutral' },
        { sector: 'Nifty Metal', performance: 'Underperform' },
    ];
    res.json({ success: true, predictions });
});

app.get('/rebalance', authenticateToken, (req, res) => {
    // In a real application, you would fetch the user's portfolio and risk profile from the database
    // and use a more sophisticated algorithm to generate the suggestions.
    const suggestions = {
        currentAllocation: {
            'Stocks': 60,
            'Bonds': 20,
            'Crypto': 20
        },
        suggestedAllocation: {
            'Stocks': 70,
            'Bonds': 25,
            'Crypto': 5
        },
        trades: [
            { action: 'SELL', asset: 'Bitcoin', amount: 15000 },
            { action: 'BUY', asset: 'Nifty 50 Index Fund', amount: 10000 },
            { action: 'BUY', asset: 'Government Bonds', amount: 5000 },
        ]
    };
    res.json({ success: true, suggestions });
});

// --- MARKET DATA SIMULATION ---



// Endpoint to fetch data from Gemini API via server



// --- OTHER ENDPOINTS ---

app.post('/ai-news', (req, res) => {
  const { portfolio } = req.body;
  // In a real application, you would fetch news from a news API
  const allNews = [
    { id: 1, headline: 'Reliance Industries to invest in green energy', relevance: ['reliance'] },
    { id: 2, headline: 'TCS reports strong quarterly earnings', relevance: ['tcs'] },
    { id: 3, headline: 'HDFC Bank launches new digital banking platform', relevance: ['hdfc'] },
    { id: 4, headline: 'Indian IT sector poised for growth', relevance: ['tcs', 'infy'] },
    { id: 5, headline: 'Global crypto market sees surge in volatility', relevance: ['btc', 'eth', 'xrp'] },
  ];

  let rankedNews = [];
  if (portfolio && portfolio.length > 0) {
    const portfolioAssets = portfolio.map(asset => asset.id);
    rankedNews = allNews.filter(news => news.relevance.some(r => portfolioAssets.includes(r)));
  }

  if (rankedNews.length === 0) {
    rankedNews = allNews;
  }

  res.json(rankedNews);
});

app.post('/portfolio-risk-analysis', (req, res) => {
  const { portfolio } = req.body;
  // In a real application, you would have more sophisticated risk analysis logic
  const riskFactors = {
    reliance: 0.8,
    tcs: 0.7,
    hdfc: 0.6,
    btc: 1.5,
    eth: 1.4,
    xrp: 1.6,
  };

  let totalRisk = 0;
  let totalValue = 0;
  if (portfolio && portfolio.length > 0) {
    portfolio.forEach(asset => {
      totalValue += asset.value;
      totalRisk += asset.value * (riskFactors[asset.type] || 1);
    });
  }

  const overallRisk = totalValue > 0 ? totalRisk / totalValue : 0;

  const analysis = {
    overallRisk: overallRisk,
    // In a real application, you would provide more detailed analysis here
    summary: `Your portfolio has a risk factor of ${overallRisk.toFixed(2)}. A factor greater than 1 indicates higher risk.`
  };

  res.json(analysis);
});

app.post('/investment-suggestions', (req, res) => {
  const { riskProfile } = req.body;
  // In a real application, you would have more sophisticated suggestion logic
  let suggestions = [];
  if (riskProfile === 'high') {
    suggestions = [
      { id: 'crypto', name: 'Cryptocurrencies', description: 'High risk, high reward. Consider a small allocation to crypto.' },
      { id: 'small-cap', name: 'Small-Cap Stocks', description: 'Potential for high growth, but also high volatility.' },
    ];
  } else if (riskProfile === 'medium') {
    suggestions = [
      { id: 'equity', name: 'Diversified Equity Funds', description: 'A balanced approach to growth.' },
      { id: 'large-cap', name: 'Large-Cap Stocks', description: 'Stable growth from established companies.' },
    ];
  } else {
    suggestions = [
      { id: 'bonds', name: 'Government Bonds', description: 'Low risk and stable returns.' },
      { id: 'fixed-deposit', name: 'Fixed Deposits', description: 'A safe option for capital preservation.' },
    ];
  }

  res.json(suggestions);
});

const otpStore = {}; // In-memory store. For production, use Redis or a database.

app.post('/send-otp', (req, res) => {
    const { mobileNumber } = req.body;
    console.log(`Sending OTP to ${mobileNumber}`);
    const otp = Math.floor(100000 + Math.random() * 900000);
    otpStore[mobileNumber] = { otp: otp, timestamp: Date.now() };
    console.log(`Generated OTP for ${mobileNumber}: ${otp}`); // For debugging only. Do not log in production.
    // Use a service like Twilio to send the OTP to the user's phone here
    res.json({ success: true, message: `OTP sent to ${mobileNumber}` });
});

app.post('/verify-otp', (req, res) => {
    const { mobileNumber, otp } = req.body;
    const storedOtpData = otpStore[mobileNumber];

    if (!storedOtpData) {
        return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    }

    const isOtpValid = storedOtpData.otp == otp;
    const isOtpExpired = (Date.now() - storedOtpData.timestamp) > 300000; // 5 minutes

    if (!isOtpValid || isOtpExpired) {
        delete otpStore[mobileNumber];
        return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    }

    delete otpStore[mobileNumber]; // OTP is used, so delete it
    res.json({ success: true, message: 'OTP verified successfully.' });
});

// Reset password endpoint
app.post('/reset-password', async (req, res) => {
    const { mobileNumber, otp, newPassword } = req.body;

    if (!mobileNumber || !otp || !newPassword) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    if (otp.length !== 6) {
        return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        db.updateUserPassword(mobileNumber, hashedPassword, (err, result) => {
            if (err) {
                console.error('Database error during password reset:', err.message);
                return res.status(500).json({ success: false, message: 'An error occurred while resetting password.' });
            }
            if (result.changes === 0) {
                return res.status(404).json({ success: false, message: 'Mobile number not found.' });
            }
            res.json({ success: true, message: 'Password reset successfully.' });
        });
    } catch (error) {
        console.error('Error during password hashing:', error);
        res.status(500).json({ success: false, message: 'An error occurred during password reset.' });
    }
});


const marketDataService = require('./marketDataService');

const server = app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
  marketDataService.initMarketDataService(server);
});