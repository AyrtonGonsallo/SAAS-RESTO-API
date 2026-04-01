
// models/Role.model.js
module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define('Role', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    titre: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    priorite:{
      type: DataTypes.INTEGER,
      allowNull: false
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
    tableName: 'Role',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });




  Role.associate = (models) => {
    Role.hasMany(models.Utilisateur, {
      foreignKey: 'role_id'
    });
  };

  return Role;
};
