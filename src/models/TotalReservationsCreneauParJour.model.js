module.exports = (sequelize, DataTypes) => {
  const TotalReservationsCreneauParJour = sequelize.define('TotalReservationsCreneauParJour', {
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
    tableName: 'TotalReservationsCreneauParJour',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  TotalReservationsCreneauParJour.associate = (models) => {
   
    TotalReservationsCreneauParJour.belongsTo(models.Restaurant, {
      foreignKey: 'restaurant_id',
    });
    TotalReservationsCreneauParJour.belongsTo(models.Societe, {
      foreignKey: 'societe_id',
    });
  }

  return TotalReservationsCreneauParJour;
};