const Sequelize = require('sequelize');
const { sequelize, connectDB } = require('../config/database');

const db = {};

// Import des modèles
db.Utilisateur = require('./Utilisateur.model')(sequelize, Sequelize.DataTypes);
db.Role = require('./Role.model')(sequelize, Sequelize.DataTypes);
db.Societe = require('./Societe.model')(sequelize, Sequelize.DataTypes);
db.Restaurant = require('./Restaurant.model')(sequelize, Sequelize.DataTypes);
db.RestaurantTable = require('./RestaurantTable.model')(sequelize, Sequelize.DataTypes);
db.UtilisateurRestaurant = require('./UtilisateurRestaurant.model')(sequelize, Sequelize.DataTypes);
db.Portefeuille = require('./Portefeuille.model')(sequelize, Sequelize.DataTypes);
db.Abonnement = require('./Abonnement.model')(sequelize, Sequelize.DataTypes);
db.CategorieProduit = require('./CategorieProduit.model')(sequelize, Sequelize.DataTypes);
db.Produit = require('./Produit.model')(sequelize, Sequelize.DataTypes);
db.VariationProduit = require('./VariationProduit.model')(sequelize, Sequelize.DataTypes);
db.Parametre = require('./Parametre.model')(sequelize, Sequelize.DataTypes);


// 🔗 Associations
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Export
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;