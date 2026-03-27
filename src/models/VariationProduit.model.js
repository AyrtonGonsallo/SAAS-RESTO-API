module.exports = (sequelize, DataTypes) => {
  const VariationProduit = sequelize.define('VariationProduit', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    produit_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    titre: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    obligatoire: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    supplement_prix: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    stock: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    societe_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    restaurant_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    tableName: 'VariationProduit',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  VariationProduit.associate = (models) => {
    models.VariationProduit.belongsTo(models.Produit, {
      foreignKey: 'produit_id',
      as: 'produit'
    });
  }

  return VariationProduit;
};