module.exports = (sequelize, DataTypes) => {
  const Creneau = sequelize.define('Creneau', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    heure_debut: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    heure_fin: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    nb_reservations_actuel: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    nb_reservations_max: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    societe_id: {
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
    tableName: 'Creneau',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Creneau.associate = (models) => {
   
    Creneau.belongsTo(models.Restaurant, {
      foreignKey: 'restaurant_id',
    });
    Creneau.belongsTo(models.Societe, {
      foreignKey: 'societe_id',
    });
  }

  return Creneau;
};