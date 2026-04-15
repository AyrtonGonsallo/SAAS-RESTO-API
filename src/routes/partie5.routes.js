// cat produits, variation produits
// routes/partie3.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

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

const {
  ajouterMenu,
  getMenuById, 
  getMenus,
  updateMenu,
  deleteMenu
} = require('../controllers/Menu.controller');




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

// CREATE
router.post('/ajouter_menu', upload.single('image'),ajouterMenu);

// READ ALL
router.get('/get_all_menus', getMenus);

// READ BY ID
router.get('/get_menu_by_id/:id', getMenuById);

// UPDATE
router.put('/update_menu/:id', upload.single('image'),updateMenu);

// DELETE
router.delete('/delete_menu/:id', deleteMenu);


module.exports = router;