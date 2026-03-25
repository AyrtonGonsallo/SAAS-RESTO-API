// models/Utilisateur.model.js
module.exports = (sequelize, DataTypes) => {
  const Utilisateur = sequelize.define('Utilisateur', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nom: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    prenom: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    telephone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    mot_de_passe: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    derniere_connexion: {
      type: DataTypes.DATE,
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
    refresh_token: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    refresh_token_expiration: {
      type: DataTypes.DATE,
      allowNull: true
    },
    reset_password_token: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    reset_password_expires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    email_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    email_verified_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    verification_token: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    two_factor_secret: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    two_factor_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'Utilisateur',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Utilisateur.associate = (models) => {
    Utilisateur.belongsTo(models.Role, {
      foreignKey: 'role_id'
    });

    Utilisateur.belongsTo(models.Societe, {
      foreignKey: 'societe_id'
    });

    Utilisateur.belongsTo(models.Restaurant, {
      foreignKey: 'restaurant_id'
    });
  };

  return Utilisateur;
};