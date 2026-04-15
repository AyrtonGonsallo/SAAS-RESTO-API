const db = require('../models');
const {  Notification,Societe,Restaurant,Utilisateur } = db;

exports.createNotification = async (req, res) => {
  try {
    const notification = await Notification.create(req.body);
    res.json(notification);
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const selectedRestaurantId = req.query.restaurant_id;
    let restaurantFilter = {};

    let ishigh = req.role_priorite<4

    if (!ishigh) {
        if (selectedRestaurantId) {
        // 🔥 filtre sur UN restaurant
        restaurantFilter = {
            restaurant_id: selectedRestaurantId,
            societe_id: req.societe_id
        };
        } else {
        // 🔥 filtre sur plusieurs restaurants autorisés
        restaurantFilter = {
            restaurant_id: {
            [Op.in]: req.restos
            },
            societe_id: req.societe_id
        };
        }
    }else{
        if (req.isSuperAdmin) {
        restaurantFilter = {}
        }else{
        restaurantFilter = {societe_id: req.societe_id}
        }
    }
    const where = {};

    if (req.query.restaurant_id) {
      where.restaurant_id = req.query.restaurant_id;
    }
    

    const notifications = await Notification.findAll({
      where:restaurantFilter,
      include: [
        {
            model: Restaurant,
            attributes: ['id', 'nom', 'coordonnees_google_maps', 'ville', 'adresse', 'heure_debut', 'heure_fin', 'telephone'],
            required: false,
        },
        {
            model: Societe,
            attributes: ['id', 'titre', ],
            required: false,
        },
      ],
      order: [['created_at', 'DESC']]
    });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getNotificationById = async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification non trouvé' });
    }

    res.json(notification);
    await notification.update({statut_lecture:'lue'});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getNotificationsByUserId = async (req, res) => {
  try {

    const utilisateur = await Utilisateur.findByPk(req.params.userid,{
      
    } );
    const notifications = await Notification.findAll({
      where: {
        utilisateur_id: req.params.userid
      },
    });

    const notificationsAdmin = await Notification.findAll({
      where: {
        utilisateur_id: 0,
        societe_id:utilisateur.societe_id
      },
    });

    const allNotifications = [
      ...notifications,
      ...notificationsAdmin
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json(allNotifications);
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message });
  }
};

exports.getUnreadNotificationsByUserId = async (req, res) => {
  try {

    const utilisateur = await Utilisateur.findByPk(req.params.userid,{
      
    } );
    const notifications = await Notification.findAll({
      where: {
        utilisateur_id: req.params.userid,
        statut_lecture:'non lue'
      },
    });

    const notificationsAdmin = await Notification.findAll({
      where: {
        utilisateur_id: 0,
        statut_lecture:'non lue',
        societe_id:utilisateur.societe_id
      },
    });

    const allNotifications = [
      ...notifications,
      ...notificationsAdmin
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json(allNotifications);
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message });
  }
};

exports.updateNotification = async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification non trouvé' });
    }

    await notification.update(req.body);

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification non trouvé' });
    }

    await notification.destroy();

    res.json({ message: 'Notification supprimé' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};