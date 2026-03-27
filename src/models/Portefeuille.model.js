module.exports = (sequelize, DataTypes) => {
  const Portefeuille = sequelize.define('Portefeuille', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    solde_sms: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    solde_ia: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    historique_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    alert_seuil_sms: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 10.00
    },
    alert_seuil_ia: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 10.00
    },
    societe_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'Portefeuille',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Portefeuille;
};