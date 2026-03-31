module.exports = (sequelize, DataTypes) => {
  const Produit = sequelize.define('Produit', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    statut: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    titre: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    image: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    categorie_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    actif: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    prix_ht: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    tva: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    allergenes: {
      type: DataTypes.TEXT,
      allowNull: true
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
    tableName: 'Produit',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Produit.associate = (models) => {

    Produit.belongsTo(models.CategorieProduit, {
      foreignKey: 'categorie_id',
      as: 'categorie'
    });

    Produit.hasMany(models.VariationProduit, {
      foreignKey: 'produit_id',
      as: 'variations'
    });

    Produit.belongsTo(models.Restaurant, {
      foreignKey: 'restaurant_id',
    });

  }

  return Produit;
};