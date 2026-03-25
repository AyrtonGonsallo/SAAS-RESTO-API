// models/Societe.model.js
module.exports = (sequelize, DataTypes) => {
  const Societe = sequelize.define('Societe', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    titre: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    gestionnaire_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    date_creation: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    abonnement_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    portefeuille_id: {
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
    tableName: 'Societe',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Societe;
};