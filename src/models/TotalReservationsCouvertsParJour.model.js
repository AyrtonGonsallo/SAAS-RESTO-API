module.exports = (sequelize, DataTypes) => {
  const TotalReservationsCouvertsParJour = sequelize.define('TotalReservationsCouvertsParJour', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    service_id: {
      type:  DataTypes.INTEGER,
      allowNull: false
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    nb_reservations_actuel: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    nb_couverts_actuel: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    societe_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    restaurant_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    utilisateur_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    tableName: 'TotalReservationsCouvertsParJour',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  TotalReservationsCouvertsParJour.associate = (models) => {
   
    TotalReservationsCouvertsParJour.belongsTo(models.Restaurant, {
      foreignKey: 'restaurant_id',
    });
    TotalReservationsCouvertsParJour.belongsTo(models.Societe, {
      foreignKey: 'societe_id',
    });
  }

  return TotalReservationsCouvertsParJour;
};

//permet de verifier qu'un utilisateur ne depasse pas le nombre de couverts pour un service
//pour max couverts par jour c'est pris en compte deja
//juste décrémenter incrémenter