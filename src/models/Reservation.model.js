module.exports = (sequelize, DataTypes) => {
  const Reservation = sequelize.define('Reservation', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    date_creation: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    date_reservation: {
      type: DataTypes.DATE,
      allowNull: false
    },
    plage_horaire: {
      type:  DataTypes.STRING(45),
      allowNull: true
    },
    nombre_de_personnes: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    nb_couverts: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    demandes_speciales: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    total_reservations_couverts_par_jour_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    service_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    statut: {
      type: DataTypes.ENUM('En attente', 'Confirmée','En cours','Annulée','Terminée','No-show'),
      allowNull: false,
      defaultValue: 'En attente'
    },
    avis_envoye: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    societe_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    restaurant_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    tableName: 'Reservation',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Reservation.associate = (models) => {
   
    Reservation.belongsTo(models.Restaurant, {
      foreignKey: 'restaurant_id',
    });
    

    Reservation.belongsToMany(models.RestaurantTable, {
      through: 'ReservationTable',
      foreignKey: 'reservation_id',
      otherKey: 'table_id',
      as: 'tables'
    });

    Reservation.belongsTo(models.Service, {
      foreignKey: 'service_id',
      as: 'service'
    });


    Reservation.belongsTo(models.Utilisateur, {
      foreignKey: 'client_id',
      as: 'client'
    });

    Reservation.belongsTo(models.Societe, {
      foreignKey: 'societe_id',
      as: 'societe'
    });

    // 1 → N Paiements
    Reservation.hasMany(models.Paiement, {
      foreignKey: 'reservation_id',
      as: 'paiements'
    });

    // N ↔ N Tags
    Reservation.belongsToMany(models.Tag, {
      through: 'ReservationTag',
      foreignKey: 'reservation_id',
      otherKey: 'tag_id',
      as: 'tags'
    });

   

    //un utilisateur, une table, un service, un creneau, plusieurs paiements, plusieurs tags
  }

  return Reservation;
};
