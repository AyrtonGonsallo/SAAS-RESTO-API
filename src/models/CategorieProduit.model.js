module.exports = (sequelize, DataTypes) => {
  const CategorieProduit = sequelize.define('CategorieProduit', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    titre: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    ordre: {
      type: DataTypes.INTEGER,
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
    tableName: 'CategorieProduit',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  CategorieProduit.associate = (models) => {
   
    CategorieProduit.belongsTo(models.Restaurant, {
      foreignKey: 'restaurant_id',
    });
  }

  return CategorieProduit;
};