require('dotenv').config();
const express = require('express');
const { connectDB } = require('./config/database');

const app = express();

app.use(express.json());
app.use('/api/v1', require('./routes'));
// test route
app.get('/api/v1', (req, res) => {
    res.send('API OK');
});

// démarrage
const start = async () => {
    await connectDB();

    const PORT = process.env.PORT || 2026;

    app.listen(PORT, () => {
        console.log(`🚀 Serveur lancé sur le port ${PORT}`);
    });
};

start();

module.exports = app;

// 7840

// 7773