require('dotenv').config();
const express = require('express');
const loggerMiddleware = require('./middlewares/logger.middleware');
const errorMiddleware = require('./middlewares/error.middleware');
const { connectDB } = require('./config/database');
const app = express();
const cors = require('cors');
const partie1Routes = require('./routes/partie1.routes');
const partie2Routes = require('./routes/partie2.routes');
const partie3Routes = require('./routes/partie3.routes');
const authRoutes = require('./routes/partie-auth.routes');
const routes_prefix = '/api/v1';

const { getAllMethods } = require('./services/methods-liste.service');

app.use(loggerMiddleware);
app.use(cors({
  origin: 'http://localhost:4400'
}));
app.use(express.json());
app.use(routes_prefix, require('./routes'));
app.use(routes_prefix, partie1Routes);
app.use(routes_prefix, partie2Routes);
app.use(routes_prefix, partie3Routes);
app.use(routes_prefix, authRoutes);

// test route
app.get(routes_prefix, (req, res) => {
    let liste = getAllMethods()
    res.send(liste);
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

