module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define('Message', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    type: {
      type: DataTypes.ENUM('sms', 'email',),
      allowNull: false,
      defaultValue: 'email'
    },
    titre: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    texte: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    date_envoi: {
      type: DataTypes.DATE,
      allowNull: true
    },
    statut_envoi: {
      type: DataTypes.ENUM('en_attente', 'envoyé', 'échoué'),
      defaultValue: 'en_attente'
    },
    reservation_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    commande_id: {
      type: DataTypes.INTEGER,
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
    employe_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
    ,
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    tableName: 'Message',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Message.associate = (models) => {
   
    Message.belongsTo(models.Restaurant, {
      foreignKey: 'restaurant_id',
    });
    Message.belongsTo(models.Societe, {
      foreignKey: 'societe_id',
    });
    Message.belongsTo(models.Reservation, {
      foreignKey: 'reservation_id',
    });
     Message.belongsTo(models.Commande, {
      foreignKey: 'commande_id',
    });
     Message.belongsTo(models.Utilisateur, {
      foreignKey: 'employe_id',
      as: 'employe'
    });
     Message.belongsTo(models.Utilisateur, {
      foreignKey: 'client_id',
      as: 'client'
    });
  }

  return Message;
};