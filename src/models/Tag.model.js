module.exports = (sequelize, DataTypes) => {
  const Tag = sequelize.define('Tag', {
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
    tableName: 'Tag',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Tag.associate = (models) => {
   
    Tag.belongsTo(models.Restaurant, {
      foreignKey: 'restaurant_id',
    });

    Tag.belongsTo(models.Societe, {
      foreignKey: 'societe_id',
    });
    Tag.belongsToMany(models.Reservation, {
      through: 'ReservationTag',
      foreignKey: 'tag_id',
      otherKey: 'reservation_id',
      as: 'reservations'
    });
    
  }

  return Tag;
};