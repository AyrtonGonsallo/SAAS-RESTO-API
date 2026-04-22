module.exports = (sequelize, DataTypes) => {
  const Paiement = sequelize.define('Paiement', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    titre: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('Acompte', 'Solde final'),
      allowNull: false
    },
    moyen: {
      type: DataTypes.ENUM('Stripe', 'Virement'),
      allowNull: false
    },
    montant: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    reference: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    societe_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    commande_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    reservation_id: {
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
    tableName: 'Paiement',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Paiement.associate = (models) => {
   
    Paiement.belongsTo(models.Restaurant, {
      foreignKey: 'restaurant_id',
    });
    Paiement.belongsTo(models.Reservation, {
      foreignKey: 'reservation_id',
      as: 'reservation'
    });
    Paiement.belongsTo(models.Commande, {
      foreignKey: 'commande_id',
      as: 'commande'
    });
    Paiement.belongsTo(models.Societe, {
      foreignKey: 'societe_id',
    });
    Paiement.belongsTo(models.Utilisateur, {
      foreignKey: 'utilisateur_id',
    });
  }

  return Paiement;
};