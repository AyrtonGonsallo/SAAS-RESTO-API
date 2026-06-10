// models/RestaurantHoraire.model.js
module.exports = (sequelize, DataTypes) => {
  const RestaurantHoraire = sequelize.define('RestaurantHoraire', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    jour: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    ferme: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    heure_debut: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    heure_fin: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM('Réservation', 'Click and collect',),
      allowNull: false
    },
    service_id: {
      type: DataTypes.INTEGER,
      allowNull: true
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
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'RestaurantHoraire',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  RestaurantHoraire.associate = (models) => {
    RestaurantHoraire.belongsTo(models.Societe, {
      foreignKey: 'societe_id'
    });
    RestaurantHoraire.belongsTo(models.Restaurant, {
      foreignKey: 'restaurant_id',
    });
    RestaurantHoraire.belongsTo(models.Service, {
      foreignKey: 'service_id',
    });


  };

  return RestaurantHoraire;
};