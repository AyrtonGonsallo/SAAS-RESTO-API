const db = require('../models');
const bcrypt = require('bcryptjs');
const {  Reservation,Societe,Restaurant,Utilisateur,Role } = db;
const DEFAULT_PASS = process.env.DEFAULT_PASS;

exports.createReservation = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const {
      nom,
      prenom,
      email,
      telephone,
      date_reservation,
      heure_reservation,
      societe_id,
      restaurant_id,
      tags,
      ...rest
    } = req.body;

    // ✅ 1. Gérer utilisateur existant
    let client = await Utilisateur.findOne({ where: { email }, transaction: t });

    if (!client) {
      const hashedPassword = await bcrypt.hash(DEFAULT_PASS, 10);

      const role = await Role.findOne({
        where: { type: 'client' },
        transaction: t
      });

      if (!role) {
        await t.rollback();
        return res.status(404).json({ message: 'Rôle non trouvé' });
      }

      client = await Utilisateur.create({
        nom,
        prenom,
        email,
        telephone,
        mot_de_passe: hashedPassword,
        role_id: role.id,
        societe_id,
      }, { transaction: t });

      
      await client.setRestaurants([restaurant_id],{ transaction: t });
      
    }

    // ✅ 2. Convertir date + heure Angular → Date SQL
    const dateObj = new Date(
      date_reservation.year,
      date_reservation.month - 1,
      date_reservation.day,
      heure_reservation.hour,
      heure_reservation.minute,
      heure_reservation.second || 0
    );

    // ✅ 3. Créer réservation
    const reservation = await Reservation.create({
      ...rest,
      societe_id,
      restaurant_id,
      date_reservation: dateObj,
      client_id: client.id
    }, { transaction: t });

    if (tags && Array.isArray(tags)) {
      await reservation.setTags(tags, { transaction: t });
    }

    await t.commit();

    const reservationObjet = await Reservation.findByPk(reservation.id, {
      include: [
        { association: 'client' },
        { association: 'table' },
        { association: 'service' },
        { association: 'creneau' },
        { association: 'societe' },
        { association: 'paiements' },
        { association: 'tags' },
        { association: 'messages' }
      ]
    });

    res.json(reservationObjet);

  } catch (error) {
    await t.rollback();
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

exports.getReservations = async (req, res) => {
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
    

    const reservations = await Reservation.findAll({
         where:restaurantFilter,
          include: [
            {
                model: Restaurant,
                attributes: ['id', 'nom', 'lieu', 'heure_debut', 'heure_fin', 'telephone'],
                required: false,
            },
            { association: 'client' },
            { association: 'table' },
            { association: 'service' },
            { association: 'creneau' },
            { association: 'societe' },
            { association: 'paiements' },
            { association: 'tags' },
            { association: 'messages' }
        ],

    }
);

    res.json(reservations);
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message });
  }
};

exports.getReservationById = async (req, res) => {
  try {
    const reservation = await Reservation.findByPk(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation non trouvé' });
    }

    res.json(reservation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findByPk(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation non trouvé' });
    }

    await reservation.update(req.body);

    res.json(reservation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findByPk(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation non trouvé' });
    }

    await reservation.destroy();

    res.json({ message: 'Reservation supprimé' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};