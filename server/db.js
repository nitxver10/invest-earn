const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mobile TEXT UNIQUE,
        email TEXT UNIQUE,
        password TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS portfolios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        asset_id TEXT,
        asset_name TEXT,
        quantity REAL,
        purchase_price REAL,
        purchase_date TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS watchlists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        asset_id TEXT,
        asset_name TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS preferences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE,
        risk_profile TEXT,
        investment_horizon TEXT,
        communication_preferences TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        asset_id TEXT,
        condition TEXT,
        target_price REAL,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`);
});

function createUser(mobile, email, password, callback) {
    const sql = `INSERT INTO users (mobile, email, password) VALUES (?, ?, ?)`;
    db.run(sql, [mobile, email, password], function(err) {
        callback(err, { id: this.lastID });
    });
}

function findUserByMobile(mobile, callback) {
    const sql = `SELECT * FROM users WHERE mobile = ?`;
    db.get(sql, [mobile], (err, user) => {
        callback(err, user);
    });
}

function updateUserPassword(mobile, password, callback) {
    const sql = `UPDATE users SET password = ? WHERE mobile = ?`;
    db.run(sql, [password, mobile], function(err) {
        callback(err, { changes: this.changes });
    });
}

function getPortfolio(userId, callback) {
    const sql = `SELECT * FROM portfolios WHERE user_id = ?`;
    db.all(sql, [userId], (err, rows) => {
        callback(err, rows);
    });
}

function addAssetToPortfolio(userId, assetId, assetName, quantity, purchasePrice, purchaseDate, callback) {
    const sql = `INSERT INTO portfolios (user_id, asset_id, asset_name, quantity, purchase_price, purchase_date) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(sql, [userId, assetId, assetName, quantity, purchasePrice, purchaseDate], function(err) {
        callback(err, { id: this.lastID });
    });
}

function getWatchlist(userId, callback) {
    const sql = `SELECT * FROM watchlists WHERE user_id = ?`;
    db.all(sql, [userId], (err, rows) => {
        callback(err, rows);
    });
}

function addAssetToWatchlist(userId, assetId, assetName, callback) {
    const sql = `INSERT INTO watchlists (user_id, asset_id, asset_name) VALUES (?, ?, ?)`;
    db.run(sql, [userId, assetId, assetName], function(err) {
        callback(err, { id: this.lastID });
    });
}

function removeAssetFromWatchlist(userId, assetId, callback) {
    const sql = `DELETE FROM watchlists WHERE user_id = ? AND asset_id = ?`;
    db.run(sql, [userId, assetId], function(err) {
        callback(err, { changes: this.changes });
    });
}

function getPreferences(userId, callback) {
    const sql = `SELECT * FROM preferences WHERE user_id = ?`;
    db.get(sql, [userId], (err, row) => {
        callback(err, row);
    });
}

function updatePreferences(userId, riskProfile, investmentHorizon, communicationPreferences, callback) {
    const sql = `INSERT OR REPLACE INTO preferences (user_id, risk_profile, investment_horizon, communication_preferences) VALUES (?, ?, ?, ?)`;
    db.run(sql, [userId, riskProfile, investmentHorizon, communicationPreferences], function(err) {
        callback(err, { changes: this.changes });
    });
}

function getPlans(callback) {
    db.all("SELECT * FROM plans", [], (err, rows) => {
        callback(err, rows);
    });
}

function createSubscription(userId, planId, startDate, endDate, status, callback) {
    const sql = `INSERT INTO subscriptions (user_id, plan_id, start_date, end_date, status) VALUES (?, ?, ?, ?, ?)`;
    db.run(sql, [userId, planId, startDate, endDate, status], function(err) {
        callback(err, { id: this.lastID });
    });
}

function createAlert(userId, assetId, condition, targetPrice, callback) {
    const sql = `INSERT INTO alerts (user_id, asset_id, condition, target_price) VALUES (?, ?, ?, ?)`;
    db.run(sql, [userId, assetId, condition, targetPrice], function(err) {
        callback(err, { id: this.lastID });
    });
}

function getAlerts(userId, callback) {
    const sql = `SELECT * FROM alerts WHERE user_id = ?`;
    db.all(sql, [userId], (err, rows) => {
        callback(err, rows);
    });
}

function deleteAlert(id, userId, callback) {
    const sql = `DELETE FROM alerts WHERE id = ? AND user_id = ?`;
    db.run(sql, [id, userId], function(err) {
        callback(err, { changes: this.changes });
    });
}

function getAllAlerts(callback) {
    const sql = `SELECT * FROM alerts`;
    db.all(sql, [], (err, rows) => {
        callback(err, rows);
    });
}

module.exports = {
    createUser,
    findUserByMobile,
    updateUserPassword,
    getPortfolio,
    addAssetToPortfolio,
    getWatchlist,
    addAssetToWatchlist,
    removeAssetFromWatchlist,
    getPreferences,
    updatePreferences,
    getPlans,
    createSubscription,
    createAlert,
    getAlerts,
    deleteAlert,
    getAllAlerts
};