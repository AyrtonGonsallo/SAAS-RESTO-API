module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    type: {
      type: DataTypes.ENUM('message de confirmation', 'alerte', 'rappel','info'),
      allowNull: false,
      defaultValue: 'message de confirmation'
    },
    titre: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    texte: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    date_rappel : {
      type: DataTypes.DATE,
    },
    canal: {
      type: DataTypes.ENUM('mails', 'sms', 'site'),
      defaultValue: 'site'
    },
    statut_lecture: {
      type: DataTypes.ENUM('non lue', 'lue'),
      defaultValue: 'non lue'
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
    tableName: 'Notification',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Notification.associate = (models) => {
   
    Notification.belongsTo(models.Restaurant, {
      foreignKey: 'restaurant_id',
    });
    Notification.belongsTo(models.Societe, {
      foreignKey: 'societe_id',
    });
  }

  return Notification;
};