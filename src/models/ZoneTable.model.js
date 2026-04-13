// models/ZoneTable.model.js
module.exports = (sequelize, DataTypes) => {
  
  const ZoneTable = sequelize.define('ZoneTable', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    titre: {
      type: DataTypes.STRING(100),
      allowNull: false
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
    tableName: 'ZoneTable',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',

    
  });

  ZoneTable.associate = (models) => {
    ZoneTable.belongsTo(models.Societe, {
      foreignKey: 'societe_id'
    });

    ZoneTable.belongsTo(models.Restaurant, {
      foreignKey: 'restaurant_id',
    });
  };

  return ZoneTable;
};