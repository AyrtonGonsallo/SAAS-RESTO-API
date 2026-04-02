// models/RestaurantTable.model.js
module.exports = (sequelize, DataTypes) => {
  
  const RestaurantTable = sequelize.define('RestaurantTable', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    numero: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    nb_places: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: true
    },
    statut: {
      type: DataTypes.ENUM('libre', 'occupée'),
      allowNull: false,
      defaultValue: 'libre'
    },
    societe_id: {
      type: DataTypes.INTEGER,
    },
    restaurant_id: {
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
    tableName: 'RestaurantTable',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',

    indexes: [
      {
        unique: true,
        fields: ['restaurant_id', 'numero']
      }
    ]
  });

  RestaurantTable.associate = (models) => {
    RestaurantTable.belongsTo(models.Societe, {
      foreignKey: 'societe_id'
    });

    RestaurantTable.belongsTo(models.Restaurant, {
      foreignKey: 'restaurant_id',
    });
  };

  return RestaurantTable;
};