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
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active'
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

   Societe.associate = (models) => {

    Societe.belongsTo(models.Utilisateur, {
      foreignKey: 'gestionnaire_id',
      as: 'gestionnaire' // 👈 alias
    });

    Societe.hasOne(models.Portefeuille, {
      foreignKey: 'societe_id',
      as: 'portefeuille'
    });

    Societe.hasOne(models.Abonnement, {
      foreignKey: 'societe_id',
      as: 'abonnement'
    });
  };

  return Societe;
};