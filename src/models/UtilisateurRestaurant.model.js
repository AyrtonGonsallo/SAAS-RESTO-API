// models/UtilisateurRestaurant.model.js
module.exports = (sequelize, DataTypes) => {
const UtilisateurRestaurant = sequelize.define('UtilisateurRestaurant', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    utilisateur_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
        model: 'Utilisateur',
        key: 'id'
        },
        onDelete: 'CASCADE'
    },
    restaurant_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
        model: 'Restaurant',
        key: 'id'
        },
        onDelete: 'CASCADE'
    }
}, {
  tableName: 'UtilisateurRestaurant',
  timestamps: false
});

return UtilisateurRestaurant;
};