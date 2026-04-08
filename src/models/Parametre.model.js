// models/Parametre.model.js
module.exports = (sequelize, DataTypes) => {
  const Parametre = sequelize.define('Parametre', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    titre: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    type : {
      type: DataTypes.ENUM('tva','coefficient','logo','couleur_principale','couleur_secondaire','max_commandes_par_minutes','alerte_stocke_min','max_couverts_par_jour','etat_des_reservations','delai_rappel_reservation','cle_publique_stripe','cle_privee_stripe'),
      allowNull: false,
    },
    valeur: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    est_actif: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    societe_id : {
      type: DataTypes.INTEGER,
    },
    restaurant_id : {
      type: DataTypes.INTEGER,
    },
    utilisateur_id : {
      type: DataTypes.INTEGER,
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
    tableName: 'Parametre',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Parametre.associate = (models) => {
    Parametre.belongsTo(models.Societe, {
      foreignKey: 'societe_id'
    });

    Parametre.belongsTo(models.Restaurant, {
      foreignKey: 'restaurant_id',
    });
  };

  return Parametre;
};