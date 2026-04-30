// routes/cronReservations.routes.js
const express = require('express');
const router = express.Router();


const {
  updateReservationsStatuts,
  watchReservationsDelais, 
} = require('../controllers/cronReservations.controller');
const {
  sendQueuedMessages,
} = require('../controllers/cronMessages.controller');

// launch
router.get('/update_reservations_statuts', updateReservationsStatuts);
router.get('/watch_reservations_delais', watchReservationsDelais);
router.get('/send_queued_messages', sendQueuedMessages);


module.exports = router;