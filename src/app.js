require('dotenv').config();
const express = require('express');
const loggerMiddleware = require('./middlewares/logger.middleware');
const errorMiddleware = require('./middlewares/error.middleware');
const { connectDB } = require('./config/database');
const app = express();
const cors = require('cors');
const societeRoutes = require('./routes/partie1.routes');
const authRoutes = require('./routes/partie-auth.routes');
const routes_prefix = '/api/v1';

app.use(loggerMiddleware);
app.use(cors({
  origin: 'http://localhost:4400'
}));
app.use(express.json());
app.use(routes_prefix, require('./routes'));
app.use(routes_prefix, societeRoutes);
app.use(routes_prefix, authRoutes);

// test route
app.get(routes_prefix, (req, res) => {
    res.send('API OK');
});
app.use(errorMiddleware); 

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

