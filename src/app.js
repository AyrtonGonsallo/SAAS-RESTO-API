require('dotenv').config();
const express = require('express');
const loggerMiddleware = require('./middlewares/logger.middleware');
const errorMiddleware = require('./middlewares/error.middleware');
const auth = require('./middlewares/auth.middleware');
const tenant = require('./middlewares/tenant.middleware');
const { connectDB } = require('./config/database');
const app = express();
const cors = require('cors');
const partie1Routes = require('./routes/partie1.routes');
const partie2Routes = require('./routes/partie2.routes');
const partie3Routes = require('./routes/partie3.routes');
const partie4Routes = require('./routes/partie4.routes');
const partie5Routes = require('./routes/partie5.routes');
const stripeRoutes = require('./routes/stripe.routes');
const authRoutes = require('./routes/partie-auth.routes');
const routes_prefix = process.env.PREFIX;
const { getAllMethods } = require('./services/methods-liste.service');


app.use(`${routes_prefix}/files`, express.static('uploads'));
app.use(loggerMiddleware);

const allowedOrigins = [
  'http://localhost:4400',
  'https://resto.orocom.io'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS blocked'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(auth);
app.use(tenant);
app.use(routes_prefix, stripeRoutes);
app.options('/{*any}', cors());
app.use(express.json());
app.use(routes_prefix, require('./routes'));
app.use(routes_prefix, partie1Routes);
app.use(routes_prefix, partie2Routes);
app.use(routes_prefix, partie3Routes);
app.use(routes_prefix, partie4Routes);
app.use(routes_prefix, partie5Routes);
app.use(routes_prefix, authRoutes);

// test route
app.get(`${routes_prefix}/presentation`, (req, res) => {
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

