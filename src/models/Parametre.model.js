// models/Parametre.model.js
module.exports = (sequelize, DataTypes) => {
  const Parametre = sequelize.define('Parametre', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    titre: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    type : {
      type: DataTypes.ENUM('tva','coefficient','ecart_entre_heure_actuelle_et_heure_reservation','commande_a_l_avance','delai_avant_fermetture_commandes','delai_avant_fermetture_reservations','delai_de_preparation','moyen_notification','max_commandes_par_jour','max_commandes_par_minute','stock_min_avant_alerte','max_couverts_par_jour','etat_des_reservations','etat_du_click_and_collect','delai_rappel_reservation','delai_annulation_automatique_de_reservation','delai_annulation_gratuite_de_reservation','delai_annulation_automatique_de_commande','delai_annulation_gratuite_de_commande','duree_blocage_table','delai_invitation_avis','cle_publique_stripe','cle_privee_stripe','etat_paiement_acompte_reservation','montant_paiement_acompte_reservation','etat_paiement_acompte_click_and_collect','montant_paiement_acompte_click_and_collect','montant_livraison_click_and_collect','envoi_de_mail_recap_reservation','envoi_de_mail_recap_click_and_collect','livraison_click_and_collect'),
      allowNull: false,
    },
    type_de_valeur : {
      type: DataTypes.ENUM('unite_temporelle','statut','numerique','choix_d_options','pourcentage','coefficient','jeton'),
      allowNull: true,
    },
    unite_de_temps : {
      type: DataTypes.ENUM('secondes','minutes','heures','jours',),
      allowNull: true,
    },
    valeur: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
     valeurs_options: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    est_actif: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    est_important: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    societe_id : {
      type: DataTypes.INTEGER,
    },
    restaurant_id : {
      type: DataTypes.INTEGER,
    },
    utilisateur_id : {
      type: DataTypes.INTEGER,
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
    tableName: 'Parametre',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Parametre.associate = (models) => {
    Parametre.belongsTo(models.Societe, {
      foreignKey: 'societe_id'
    });

    Parametre.belongsTo(models.Restaurant, {
      foreignKey: 'restaurant_id',
    });
  };

  return Parametre;
};