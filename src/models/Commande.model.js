module.exports = (sequelize, DataTypes) => {
  const Commande = sequelize.define('Commande', {
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
    date_retrait: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    statut: {
      type: DataTypes.ENUM('Nouvelle', 'En préparation','Prête','Retirée','Annulée'),
      allowNull: false,
      defaultValue: 'Nouvelle'
    },
    avis_envoye: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    panier_id: {
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
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    items: {
      type: DataTypes.JSON, // MySQL 5.7+ / 8+
      allowNull: false,
      defaultValue: [],
    },

    totalPrice: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
  }, {
    tableName: 'Commande',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Commande.associate = (models) => {
   
    Commande.belongsTo(models.Restaurant, {
      foreignKey: 'restaurant_id',
    });
    Commande.belongsTo(models.Utilisateur, {
      foreignKey: 'client_id',
      as: 'client'
    });

    Commande.belongsTo(models.Societe, {
      foreignKey: 'societe_id',
      as: 'societe'
    });

  }

  return Commande;
};