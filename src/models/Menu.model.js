module.exports = (sequelize, DataTypes) => {
  const Menu = sequelize.define('Menu', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    type: {
      type: DataTypes.ENUM('Menu fixe', 'Menu du jour', 'Menu éphémère','Menu spécial'),
      allowNull: false
    },
    titre: {
      type: DataTypes.STRING(130),
      allowNull: false
    },
    image: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    actif: {
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
    }
  }, {
    tableName: 'Menu',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Menu.associate = (models) => {

 

    Menu.belongsToMany(models.Produit, {
      through: 'MenuProduit',
      foreignKey: 'menu_id',
      otherKey: 'produit_id',
      as: 'produits'
    });

    Menu.belongsTo(models.Restaurant, {
      foreignKey: 'restaurant_id',
    });

  }

  return Menu;
};