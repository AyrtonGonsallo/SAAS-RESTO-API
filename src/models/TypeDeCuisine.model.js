// models/TypeDeCuisine.model.js
module.exports = (sequelize, DataTypes) => {
  
  const TypeDeCuisine = sequelize.define('TypeDeCuisine', {
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
    tableName: 'TypeDeCuisine',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',

    
  });

  TypeDeCuisine.associate = (models) => {
    TypeDeCuisine.belongsTo(models.Societe, {
      foreignKey: 'societe_id'
    });

    TypeDeCuisine.belongsTo(models.Restaurant, {
      foreignKey: 'restaurant_id',
    });

    TypeDeCuisine.belongsToMany(models.Restaurant, {
      through: 'RestaurantTypeCuisine',
      foreignKey: 'type_de_cuisine_id',
      otherKey: 'restaurant_id',
      as: 'restaurants'
    });
  };

  return TypeDeCuisine;
};