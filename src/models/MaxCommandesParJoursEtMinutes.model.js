module.exports = (sequelize, DataTypes) => {
  const MaxCommandesParJoursEtMinutes = sequelize.define('MaxCommandesParJoursEtMinutes', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre_de_commandes: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    minute: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    date_jour: {
      type: DataTypes.DATEONLY,
      allowNull: false
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
    tableName: 'MaxCommandesParJoursEtMinutes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  MaxCommandesParJoursEtMinutes.associate = (models) => {
   
    MaxCommandesParJoursEtMinutes.belongsTo(models.Restaurant, {
      foreignKey: 'restaurant_id',
    });
    MaxCommandesParJoursEtMinutes.belongsTo(models.Societe, {
      foreignKey: 'societe_id',
    });
  }

  return MaxCommandesParJoursEtMinutes;
};

//controle le max de commandes par jour et par minutes de chaque resto
//si une commande est anullée garder son id dans commande et decrementer nb_commandes