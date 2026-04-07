module.exports = (sequelize, DataTypes) => {
  const Service = sequelize.define('Service', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    type: {
      type: DataTypes.ENUM('Midi', 'Soir','Évenement'),
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
    tableName: 'Service',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Service.associate = (models) => {
   
    Service.belongsTo(models.Restaurant, {
      foreignKey: 'restaurant_id',
    });
    Service.belongsTo(models.Societe, {
      foreignKey: 'societe_id',
    });
  }

  return Service;
};