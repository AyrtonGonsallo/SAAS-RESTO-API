module.exports = (sequelize, DataTypes) => {
  const Panier = sequelize.define('Panier', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    total_ht: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    total_ttc: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    tva: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    coefficient: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    statut: {
      type: DataTypes.ENUM('en attente', 'payé'),
      allowNull: false,
      defaultValue: 'en attente'
    },
    societe_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    paiement_id: {
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
  }, {
    tableName: 'Panier',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Panier.associate = (models) => {
   
    Panier.belongsTo(models.Restaurant, {
      foreignKey: 'restaurant_id',
    });
    Panier.belongsTo(models.Paiement, {
      foreignKey: 'paiement_id',
      as: 'paiement'
    });
    Panier.belongsTo(models.Societe, {
      foreignKey: 'societe_id',
    });
    Panier.belongsTo(models.Utilisateur, {
      foreignKey: 'client_id',
      as: 'client'
    });

  }

  return Panier;
};