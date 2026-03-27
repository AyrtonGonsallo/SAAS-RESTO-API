module.exports = (sequelize, DataTypes) => {
  const Abonnement = sequelize.define('Abonnement', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    formule: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    cout: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    date_debut: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    date_expiration: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    dernier_renouvellement: {
      type: DataTypes.DATE,
      allowNull: true
    },
    statut: {
      type: DataTypes.STRING(50),
      defaultValue: 'actif'
    },
    renouvellement_auto: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    societe_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'Abonnement',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Abonnement;
};