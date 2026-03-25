// models/Restaurant.model.js
module.exports = (sequelize, DataTypes) => {
  const Restaurant = sequelize.define('Restaurant', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nom: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    lieu: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    horaires: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    horaires_cc: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    commandes_par_minutes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
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
      foreignKey: 'utilisateur_id'
    });
  };

  return Restaurant;
};