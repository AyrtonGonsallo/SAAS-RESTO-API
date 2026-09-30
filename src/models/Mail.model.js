module.exports = (sequelize, DataTypes) => {
  const Mail = sequelize.define('Mail', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    type: {
      type: DataTypes.ENUM('recap-reservation', 'recap-commande', 'avis-commande','avis-reservation'),
      allowNull: false,
      defaultValue: 'recap-reservation'
    },
     section: {
      type: DataTypes.ENUM('body-1','body-2', 'footer-1', 'footer-2'),
      allowNull: false,
      defaultValue: 'body-1'
    },
    
    texte: {
      type: DataTypes.TEXT,
      allowNull: false
    },
   
    societe_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    restaurant_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
  }, {
    tableName: 'Mail',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Mail.associate = (models) => {
   
    Mail.belongsTo(models.Restaurant, {
      foreignKey: 'restaurant_id',
    });
    Mail.belongsTo(models.Societe, {
      foreignKey: 'societe_id',
    });
  }

  return Mail;
};