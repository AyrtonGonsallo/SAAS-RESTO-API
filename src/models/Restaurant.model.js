// models/Restaurant.model.js
module.exports = (sequelize, DataTypes) => {
  const Restaurant = sequelize.define('Restaurant', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nom: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    adresse: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    ville: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    coordonnees_google_maps: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    heure_debut: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    heure_fin: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    heure_cc_debut: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    heure_cc_fin: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    telephone: {
      type: DataTypes.STRING(20),
    },
    societe_id: {
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
    tableName: 'Restaurant',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Restaurant.associate = (models) => {
    Restaurant.belongsTo(models.Societe, {
      foreignKey: 'societe_id'
    });

    Restaurant.belongsTo(models.Utilisateur, {
      foreignKey: 'utilisateur_id',
      as: 'gestionnaire' // 👈 alias
    });
    Restaurant.hasMany(models.Parametre, {
      foreignKey: 'restaurant_id',
      as: 'parametres'
    });
    // N ↔ N Tags
    Restaurant.belongsToMany(models.TypeDeCuisine, {
      through: 'RestaurantTypeCuisine',
      foreignKey: 'restaurant_id',
      otherKey: 'type_de_cuisine_id',
      as: 'types_de_cuisine'
    });

  };

  return Restaurant;
};