// routes/cronReservations.routes.js
const express = require('express');
const router = express.Router();


const {
  updateReservationsStatuts,
  watchReservationsDelais, 
} = require('../controllers/cronReservations.controller');

// READ ALL
router.get('/update_reservations_statuts', updateReservationsStatuts);
router.get('/watch_reservations_delais', watchReservationsDelais);


module.exports = router;