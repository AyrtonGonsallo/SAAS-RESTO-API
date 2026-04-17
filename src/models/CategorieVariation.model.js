module.exports = (sequelize, DataTypes) => {
  const CategorieVariation = sequelize.define('CategorieVariation', {
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
    obligatoire: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
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
    tableName: 'CategorieVariation',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  CategorieVariation.associate = (models) => {
   
    CategorieVariation.belongsTo(models.Restaurant, {
      foreignKey: 'restaurant_id',
    });
     CategorieVariation.belongsTo(models.Societe, {
      foreignKey: 'societe_id',
    });
  }

  return CategorieVariation;
};