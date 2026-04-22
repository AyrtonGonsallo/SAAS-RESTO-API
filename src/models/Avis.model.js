module.exports = (sequelize, DataTypes) => {
  const Avis = sequelize.define('Avis', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    reservation_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    commande_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    objet: {
      type: DataTypes.ENUM('Réservation', 'Click & collect'),
      defaultValue: 'Réservation'
    },
    note: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    texte: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    approuve: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    restaurant_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    societe_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'Avis',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

   Avis.associate = (models) => {
   
    Avis.belongsTo(models.Restaurant, {
      foreignKey: 'restaurant_id',
    });
    Avis.belongsTo(models.Utilisateur, {
      foreignKey: 'client_id',
      as: 'client'
    });

    Avis.belongsTo(models.Societe, {
      foreignKey: 'societe_id',
    });

  }

  return Avis;
};