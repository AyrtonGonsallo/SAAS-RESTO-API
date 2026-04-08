module.exports = (sequelize, DataTypes) => {
  const CreneauDuJour = sequelize.define('CreneauDuJour', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    creneau_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    heure: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    nb_reservations_actuel: {
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
    tableName: 'CreneauDuJour',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  CreneauDuJour.associate = (models) => {
   
    CreneauDuJour.belongsTo(models.Restaurant, {
      foreignKey: 'restaurant_id',
    });
    CreneauDuJour.belongsTo(models.Societe, {
      foreignKey: 'societe_id',
    });
  }

  return CreneauDuJour;
};