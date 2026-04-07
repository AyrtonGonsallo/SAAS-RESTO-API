module.exports = (sequelize, DataTypes) => {
  const MessageReservation = sequelize.define('MessageReservation', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    type: {
      type: DataTypes.ENUM('message de confirmation', 'alerte','rappel','invitation à laisser un avis',),
      allowNull: false,
      defaultValue: 'message de confirmation'
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
    tableName: 'MessageReservation',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  MessageReservation.associate = (models) => {
   
    MessageReservation.belongsTo(models.Restaurant, {
      foreignKey: 'restaurant_id',
    });
    MessageReservation.belongsTo(models.Societe, {
      foreignKey: 'societe_id',
    });
    MessageReservation.belongsTo(models.Reservation, {
      foreignKey: 'reservation_id',
    });
  }

  return MessageReservation;
};