module.exports = (sequelize, DataTypes) => {
  const ReservationsTablesParCreneauJour = sequelize.define('ReservationsTablesParCreneauJour', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    creneau_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    table_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    reservation_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    date: {
      type: DataTypes.DATEONLY,
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
    tableName: 'ReservationsTablesParCreneauJour',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  ReservationsTablesParCreneauJour.associate = (models) => {
   
    ReservationsTablesParCreneauJour.belongsTo(models.Restaurant, {
      foreignKey: 'restaurant_id',
    });
    ReservationsTablesParCreneauJour.belongsTo(models.Societe, {
      foreignKey: 'societe_id',
    });
  }

  return ReservationsTablesParCreneauJour;
};