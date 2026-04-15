// cat produits, variation produits
// routes/partie3.routes.js
const express = require('express');
const router = express.Router();


const {
  createTypeDeCuisine,
  getTypeDeCuisines, 
  getTypeDeCuisineById,
  updateTypeDeCuisine,
  deleteTypeDeCuisine
} = require('../controllers/TypeDeCuisine.controller');


const {
  createZoneTable,
  getZoneTables, 
  getZoneTableById,
  updateZoneTable,
  deleteZoneTable
} = require('../controllers/ZoneTable.controller');

const {
  createNotification,
  getNotificationById,
  getNotificationsByUserId, 
  getUnreadNotificationsByUserId,
  getNotifications,
  updateNotification,
  deleteNotification
} = require('../controllers/Notification.controller');






// CREATE
router.post('/ajouter_type_cuisine', createTypeDeCuisine);

// READ ALL
router.get('/get_all_types_cuisine', getTypeDeCuisines);

// READ BY ID
router.get('/get_type_cuisine_by_id/:id', getTypeDeCuisineById);

// UPDATE
router.put('/update_type_cuisine/:id', updateTypeDeCuisine);

// DELETE
router.delete('/delete_type_cuisine/:id', deleteTypeDeCuisine);


// CREATE
router.post('/ajouter_zone_table', createZoneTable);

// READ ALL
router.get('/get_all_zones_table', getZoneTables);

// READ BY ID
router.get('/get_zone_table_by_id/:id', getZoneTableById);

// UPDATE
router.put('/update_zone_table/:id', updateZoneTable);

// DELETE
router.delete('/delete_zone_table/:id', deleteZoneTable);

// CREATE
router.post('/ajouter_notification', createNotification);

// READ ALL
router.get('/get_all_notifications', getNotifications);

// READ BY ID
router.get('/get_notification_by_id/:id', getNotificationById);

// READ BY USERID
router.get('/get_all_notifications_by_id/:userid', getNotificationsByUserId);

router.get('/get_all_unread_notifications_by_id/:userid', getUnreadNotificationsByUserId);

// UPDATE
router.put('/update_notification/:id', updateNotification);

// DELETE
router.delete('/delete_notification/:id', deleteNotification);




module.exports = router;