// routes/cronReservations.routes.js
const express = require('express');
const router = express.Router();


const {
  updateReservationsStatuts,
  watchReservationsDelais, 
  checkAndChangeServicesStatus
} = require('../controllers/cronReservations.controller');
const {
  sendQueuedMessages,
} = require('../controllers/cronMessages.controller');

// launch
router.get('/update_reservations_statuts', updateReservationsStatuts);
router.get('/watch_reservations_delais', watchReservationsDelais);
router.get('/send_queued_messages', sendQueuedMessages);
router.get('/check_and_change_services_status', checkAndChangeServicesStatus);

module.exports = router;