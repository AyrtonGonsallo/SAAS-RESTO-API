module.exports = (sequelize, DataTypes) => {
  const Livraison = sequelize.define('Livraison', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    date_livraison : {
      type: DataTypes.DATE,
      allowNull: false
    },
    notes_livreur: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    adresse_livraison: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    code_postal: {
      type:  DataTypes.STRING(10),
      allowNull: true
    },
    ville: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    frais_livraison: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    commande_id : {
      type: DataTypes.INTEGER,
    },
    livreur_id : {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    statut: {
      type: DataTypes.ENUM('En attente','En cours','Annulée','Terminée'),
      allowNull: false,
      defaultValue: 'En attente'
    },
    societe_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    restaurant_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    tableName: 'Livraison',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Livraison.associate = (models) => {
   
    Livraison.belongsTo(models.Restaurant, {
      foreignKey: 'restaurant_id',
    });
  

    Livraison.belongsTo(models.Utilisateur, {
      foreignKey: 'client_id',
      as: 'client'
    });
    Livraison.belongsTo(models.Commande, {
      foreignKey: 'commande_id',
      as: 'commande'
    });

    Livraison.belongsTo(models.Utilisateur, {
      foreignKey: 'livreur_id',
      as: 'livreur'
    });

    Livraison.belongsTo(models.Societe, {
      foreignKey: 'societe_id',
      as: 'societe'
    });



  }

  return Livraison;
};
