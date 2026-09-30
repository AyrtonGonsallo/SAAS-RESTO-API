const db = require('../models');
const bcrypt = require('bcryptjs');
const emailService = require('../services/mailer.service');
const {  Commande,Utilisateur,Restaurant,Livraison,Role,Societe,Menu,Panier,Parametre,Produit,VariationProduit,Service,MaxCommandesParJoursEtMinutes } = db;
const DEFAULT_PASS = process.env.DEFAULT_PASS;
const notificationService = require('../services/notifications.service');
const { Op,Sequelize  } = require('sequelize');

exports.createCommande = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const {
      commandeDatas,
      elements_panier
    } = req.body;
    const {
      nom,
      prenom,
      email,
      adresse_livraison,
      telephone,
      date_retrait,
      heure_retrait,
      societe_id,
      restaurant_id,
      ...rest
    } = commandeDatas;

    const [hD, mD] = heure_retrait.split(':').map(Number);

    const dateObj = new Date(Date.UTC(
      date_retrait.year,
      date_retrait.month - 1,
      date_retrait.day,
      hD,
      mD,
      0
    ));

    
    //1) prendre la date actuelle et la minute actuelle
    //2) prendre les MaxCommandesParJoursEtMinutes pour ce jour (champs nombre_de_commandes number, minute number, date_jour date)
    //3) chercher la minute actuelle et verifier qu'on peux le faire (nombre_de_commandes<valeur_max_commandes_par_minute)
    //4) faire la somme des nombre_de_commandes par jour et verifier qu'on peux le faire (nombre_de_commandes<valeur_max_commandes_par_minute)

   


    let param_max_commandes_par_jour = Parametre.findOne({
      where: {
        type: 'max_commandes_par_jour',
        restaurant_id: restaurant_id,
        est_actif: true
      }
    });
    let param_max_commandes_par_minute = Parametre.findOne({
      where: {
        type: 'max_commandes_par_minute',
        restaurant_id: restaurant_id,
        est_actif: true
      }
    });

    const valeur_max_commandes_par_jour = Number(param_max_commandes_par_jour.valeur);
    const valeur_max_commandes_par_minute = Number(param_max_commandes_par_minute.valeur);
    const now = new Date();
    const dateActuelle = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const minuteActuelle =
      now.getHours() * 60 +
      now.getMinutes();

      // Commandes de la minute actuelle
    const maxCommandesParJoursEtMinuteActuelle =
    await MaxCommandesParJoursEtMinutes.findOne({
      where: {
        date_jour: dateActuelle,
        minute: minuteActuelle
      },
      transaction: t
    });

    // Vérification limite par minute
    if (
      maxCommandesParJoursEtMinuteActuelle &&
      maxCommandesParJoursEtMinuteActuelle.nombre_de_commandes >= valeur_max_commandes_par_minute
    ) {
      return res.status(400).json({
        message: `Nombre maximal de commandes atteint pour cette minute (${valeur_max_commandes_par_minute}).`
      });
    }

    const totalJour =
      await MaxCommandesParJoursEtMinutes.sum(
        'nombre_de_commandes',
        {
          where: {
            date_jour: dateActuelle
          },
          transaction: t
        }
      );

    const nombreCommandesJour = Number(totalJour || 0);

    // Vérification limite par jour
    if (
      nombreCommandesJour >= valeur_max_commandes_par_jour
    ) {
      return res.status(400).json({
        message: `Nombre maximal de commandes atteint pour aujourd'hui (${valeur_max_commandes_par_jour}).`
      });
    }


    const [max_commandes_par_jour_et_minute] =
      await MaxCommandesParJoursEtMinutes.findOrCreate({
        where: {
          date_jour: dateActuelle,
          minute: minuteActuelle
        },
        defaults: {
          date_jour: dateActuelle,
          minute: minuteActuelle,
          nombre_de_commandes: 0,
          societe_id:societe_id,
          restaurant_id:restaurant_id,
        },
        transaction: t
      });

    await max_commandes_par_jour_et_minute.increment(
      { nombre_de_commandes: 1 },
      { transaction: t }
    );



    

    //  1. CLIENT chercher ou creer
    let client = await Utilisateur.findOne({ where: { email }, transaction: t });

    if (!client) {
      const hashedPassword = await bcrypt.hash(DEFAULT_PASS, 10);

      const role = await Role.findOne({
        where: { type: 'client' },
        transaction: t
      });

      if (!role) {
        throw new Error('Rôle non trouvé');
      }

      client = await Utilisateur.create({
        nom,
        prenom,
        email,
        telephone,
        mot_de_passe: hashedPassword,
        role_id: role.id,
        societe_id,
      }, { transaction: t });

      await client.setRestaurants([restaurant_id], { transaction: t });
    }else{
      await client.addRestaurant(restaurant_id, { transaction: t });
    }

    const [tva_resto, coefficient_resto,montant_livraison] = await Promise.all([
        Parametre.findOne({
            where: {
            type: 'tva',
            restaurant_id: restaurant_id,
            est_actif: true
            }
        }),
        Parametre.findOne({
            where: {
            type: 'coefficient',
            restaurant_id: restaurant_id,
            est_actif: true
            }
        }),
        Parametre.findOne({
            where: {
            type: 'montant_livraison_click_and_collect',
            restaurant_id: restaurant_id,
            est_actif: true
            }
        })
    ]);

        

    console.log('elements_panier',elements_panier)

    let total_ht = 0;
    const montantLivraison = parseFloat(montant_livraison?.valeur) || 0;
    const tvaRate = parseFloat(tva_resto?.valeur) || 0;
     const coefficient_resto_value = parseFloat(coefficient_resto?.valeur) || 0;

    for (const item of elements_panier) {
      let type = item.type;
      let id = 0;
      let produitActuel = null
      

      if(type=="produit"||type=="variation-produit"){
        id = item.productId;
        produitActuel = await Produit.findByPk(item.productId, { transaction: t });
      }else if(type=="menu"){
        id = item.menuId;
        produitActuel = await Menu.findByPk(item.menuId, { transaction: t });
      }

      
      if (!produitActuel) {
        throw new Error(`Produit ${id} introuvable`);
      }

      // VERIFICATION STOCK
      if (item.quantite > produitActuel.stock) {
        return res.status(400).json({ message: `Stock insuffisant pour le produit #${id} "${item.titre}" (stock: ${produitActuel.stock}, demandé: ${item.quantite})` });
      }

    }

  

    for (const item of elements_panier) {

      const type = item.type;

      if (type === "produit" || type === "variation-produit") {

        const [updatedRows] = await Produit.update(
          {
            stock: Sequelize.literal(`stock - ${item.quantite}`)
          },
          {
            where: {
              id: item.productId,
              stock: {
                [Op.gte]: item.quantite
              }
            },
            transaction: t
          }
        );

        if (updatedRows === 0) {
          throw new Error(`Stock insuffisant pour le produit ${item.titre}`);
        }

      } else if (type === "menu") {

        const [updatedRows] = await Menu.update(
          {
            stock: Sequelize.literal(`stock - ${item.quantite}`)
          },
          {
            where: {
              id: item.menuId,
              stock: {
                [Op.gte]: item.quantite
              }
            },
            transaction: t
          }
        );

        if (updatedRows === 0) {
          throw new Error(`Stock insuffisant pour le menu ${item.titre}`);
        }
      }

      // PRIX BASE
      let prix_unitaire = parseFloat(item.prix_ht);

      // CLEAN VARIATIONS
      const variations = (item.variations || []).filter(
        (v) => v.id && v.prix_supplement != null
      );

      // AJOUT VARIATIONS
      for (const v of variations) {

        prix_unitaire += parseFloat(v.prix_supplement || 0);

        const [updatedRows] = await VariationProduit.update(
          {
            stock: Sequelize.literal(`stock - ${item.quantite}`)
          },
          {
            where: {
              id: v.id,
              stock: {
                [Op.gte]: item.quantite
              }
            },
            transaction: t
          }
        );
        console.log('item.quantite',item.quantite)

        if (updatedRows === 0) {
          throw new Error(`Stock insuffisant pour la variation ${v.titre} du produit ${item.titre}`);
        }
      }

      // TOTAL LIGNE
      const ligne_ht = prix_unitaire * item.quantite;
      total_ht += ligne_ht;
    }

    const total_coef_ht = total_ht * (coefficient_resto_value);
    const total_tva = Number((total_coef_ht * (tvaRate / 100)).toFixed(2));
    const total_ttc = total_coef_ht + total_tva;
    
    nouveau_panier = await Panier.create({
        total_ht,
        total_ttc,
        tva:parseInt(tva_resto.valeur),
        coefficient:parseInt(coefficient_resto.valeur),
        societe_id,
        restaurant_id,
        client_id:client.id
      }, { transaction: t });

    


    //  7. CRÉATION RÉSERVATION
    const commande = await Commande.create({
      ...rest,
      societe_id,
      restaurant_id,
      max_commandes_par_jour_et_minute_id:max_commandes_par_jour_et_minute.id,
      panier_id:nouveau_panier.id,
      items:JSON.parse(JSON.stringify(elements_panier)),
      date_retrait: dateObj,
      client_id: client.id,
      total_tva:total_tva,
      tva:tvaRate,
      total_coef:total_coef_ht,
      coef:coefficient_resto_value,
       totalPrice:total_ttc,
    }, { transaction: t });


    const livraison = await Livraison.create({
      date_livraison:dateObj,
      adresse_livraison:adresse_livraison??'',
      frais_livraison:montantLivraison,
      commande_id:commande.id,
      client_id:client.id,
      societe_id:societe_id,
      restaurant_id:restaurant_id

    }, { transaction: t });

    
    
    const dateRetrait = new Date(commande.date_retrait).toLocaleString('fr-FR', {
      timeZone: 'UTC',
    });

    

    
    await t.commit();


    //  9. RELOAD (hors transaction → plus rapide)
    const commandeObjet = await Commande.findByPk(commande.id, {
      include: [
        { association: 'client' },
        { association: 'societe' },
      ]
    });

    if (typeof commandeObjet.items === 'string') {
      commandeObjet.items = JSON.parse(commandeObjet.items);
    }


    res.json(commandeObjet);

  } catch (error) {
    if (!t.finished) {
      await t.rollback();
    }
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};


exports.getCommandesDatasBySocieteID = async (req, res) => {
  try {

    const societeID = req.params.societeID;

    const societe = await Societe.findByPk(societeID);

    if (!societe) {
      return res.status(404).json({
        message: 'Societe non trouvée'
      });
    }
    restaurantFilter = {societe_id: societeID};


  
    const menus = await Menu.findAll({
      where: {
      ...restaurantFilter,
        actif: true
      },
      include: [
        {
          association: 'produits', //ou actif=true
          through: { attributes: [] },
          include: [
            {
              association: 'categorie' // correspond à ton alias ou est_actif=true
            },
            {
              association: 'variations',
              include: [
                {
                  association: 'categorie' // ← ICI tu ajoutes la catégorie de variation
                }
              ]
            }
          ] 
        }
        
      ],
      order: [['type', 'ASC'],['titre', 'ASC']]
    },
  );


  const produits = await Produit.findAll({
      where: {
      ...restaurantFilter,
        actif: true
      },
      include: [
        {
          association: 'categorie' // correspond à ton alias ou est_actif=true
        },
        {
          association: 'variations',
          include: [
            {
              association: 'categorie' // ← ICI tu ajoutes la catégorie de variation
            }
          ]
        }
      ] ,
      order: [['categorie_id', 'ASC'],['titre', 'ASC']]
    },
  );


    const restaurants = await Restaurant.findAll({
      where: restaurantFilter,
      include: [
        {
          association: 'horaires',
          include: [
            {
                model: Service,
                required: false,
            }
          ],
        },
        {
          association: 'parametres',
          where: { est_important: true },
          required: false
        },
        {
          association: 'types_de_cuisine',
          through: { attributes: [] }
        }

      ],
      order: [['created_at', 'DESC']]
    });
    

    res.json({
      societe:societe,
      menus:menus,
      produits:produits,
      restaurants:restaurants,

    });
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ message: error.message });
  }
};




exports.getCommandes = async (req, res) => {
  try {

  
    const selectedRestaurantId = req.query.restaurant_id;
    let restaurantFilter = {};

    let ishigh = req.role_priorite<4

    if (!ishigh) {
        if(req.role_priorite==8){
          restaurantFilter = {societe_id: req.societe_id,client_id:req.user_id}
        }
        else if (selectedRestaurantId) {
          //  filtre sur UN restaurant
          restaurantFilter = {
              restaurant_id: selectedRestaurantId,
              societe_id: req.societe_id
          };
        } else {
          //  filtre sur plusieurs restaurants autorisés
          restaurantFilter = {
              restaurant_id: {
              [Op.in]: req.restos
              },
              societe_id: req.societe_id
          };
        }
    }else{
        if (req.isSuperAdmin) {
        restaurantFilter = {}
        }else{
            restaurantFilter = {societe_id: req.societe_id}
        }
    }
    const where = {};

    if (req.query.restaurant_id) {
      where.restaurant_id = req.query.restaurant_id;
    }
    

    const commandes = await Commande.findAll({
      where:restaurantFilter,
      include: [
        {
            model: Restaurant,
            attributes: ['id', 'nom', 'coordonnees_google_maps', 'ville', 'adresse', 'heure_debut', 'heure_fin', 'telephone', 'image'],
            required: false,
        },
        { association: 'client' },
        { association: 'societe' },
      ],
      order: [['date_retrait', 'DESC']]
    });

    commandes.forEach(cmd => {
      if (typeof cmd.items === 'string') {
        cmd.items = JSON.parse(cmd.items);
      }
    });

    res.json(commandes);
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message });
  }
};




exports.getMaxCommandes = async (req, res) => {
  try {

  
    const selectedRestaurantId = req.query.restaurant_id;
    let restaurantFilter = {};

    let ishigh = req.role_priorite<4

    if (!ishigh) {
        if(req.role_priorite==8){
          restaurantFilter = {societe_id: req.societe_id,client_id:req.user_id}
        }
        else if (selectedRestaurantId) {
          //  filtre sur UN restaurant
          restaurantFilter = {
              restaurant_id: selectedRestaurantId,
              societe_id: req.societe_id
          };
        } else {
          //  filtre sur plusieurs restaurants autorisés
          restaurantFilter = {
              restaurant_id: {
              [Op.in]: req.restos
              },
              societe_id: req.societe_id
          };
        }
    }else{
        if (req.isSuperAdmin) {
        restaurantFilter = {}
        }else{
            restaurantFilter = {societe_id: req.societe_id}
        }
    }
    const where = {};

    if (req.query.restaurant_id) {
      where.restaurant_id = req.query.restaurant_id;
    }
    

    const commandes = await Commande.findAll({
      where:restaurantFilter,
      include: [
        {
            model: Restaurant,
            attributes: ['id', 'nom', 'coordonnees_google_maps', 'ville', 'adresse', 'heure_debut', 'heure_fin', 'telephone', 'image'],
            required: false,
        },
        { association: 'client' },
        { association: 'societe' },
      ],
      order: [['date_retrait', 'DESC']],
      limit: 4
    });

    commandes.forEach(cmd => {
      if (typeof cmd.items === 'string') {
        cmd.items = JSON.parse(cmd.items);
      }
    });

    res.json(commandes);
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message });
  }
};

exports.getCommandeById = async (req, res) => {
  try {
    const commande = await Commande.findByPk(req.params.id, {
      include: [
        {
          model: Restaurant,
          attributes: ['id', 'nom', 'coordonnees_google_maps', 'ville', 'adresse', 'heure_debut', 'heure_fin', 'telephone'],
          required: false,
        },
        { association: 'client' },
        { association: 'societe' },
      ],
    });

    if (!commande) {
      return res.status(404).json({ message: 'Commande non trouvé' });
    }

    if (typeof commande.items === 'string') {
        commande.items = JSON.parse(commande.items);
      }

    res.json(commande);
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ message: error.message });
  }
};

exports.updateCommande = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const commande = await Commande.findByPk(req.params.id, {
      transaction: t,
      lock: t.LOCK.UPDATE //  important
    });

    if (!commande) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    const former_statut = commande.statut;

    const {
      date_retrait,
      heure_retrait,
      statut,
      ...rest
    } = req.body;

    //  Convert date
    const dateObj = new Date(
      date_retrait.year,
      date_retrait.month - 1,
      date_retrait.day,
      heure_retrait.hour,
      heure_retrait.minute,
      heure_retrait.second || 0
    );

   
    // groupes
    const actifs = ['Nouvelle', 'En préparation', 'Prête'];
    const inactifs = ['Annulée'];

    const elements_panier = typeof commande.items === 'string'
      ? JSON.parse(commande.items)
      : commande.items;

    // ACTIF → ANNULÉ = remettre le stock
    if (actifs.includes(former_statut) && inactifs.includes(statut)) {
      for (const item of elements_panier) {
        let type = item.type;
      
        if(type=="produit"||type=="variation-produit"){
          await Produit.increment(
            'stock',
            {
              by: item.quantite,
              where: { id: item.productId },
              transaction: t
            }
          );
        }else if(type=="menu"){
          await Menu.increment(
            'stock',
            {
              by: item.quantite,
              where: { id: item.menuId },
              transaction: t
            }
          );
        }
        
      }
    }

    // ANNULÉ → ACTIF = reprendre le stock
    else if (inactifs.includes(former_statut) && actifs.includes(statut)) {
      for (const item of elements_panier) {
        let type = item.type;
      
        if(type=="produit"||type=="variation-produit"){
          await Produit.decrement(
            'stock',
            {
              by: item.quantite,
              where: { id: item.productId },
              transaction: t
            }
          );
        }else if(type=="menu"){
          await Menu.decrement(
            'stock',
            {
              by: item.quantite,
              where: { id: item.menuId },
              transaction: t
            }
          );
        }
       
      }
    }


    //  UPDATE UNIQUE
    await commande.update({
      ...rest,
      statut,
      date_retrait: dateObj
    }, { transaction: t });

    
    await t.commit();

    //  Reload
    const commandeUpdated = await Commande.findByPk(commande.id, {
      include: [
        { association: 'client' },
        { association: 'societe' },
      ]
    });

    res.json(commandeUpdated);

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};


exports.updateFormuleCommande = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const commande = await Commande.findByPk(req.params.id, {
      transaction: t,
      lock: t.LOCK.UPDATE //  important
    });

    if (!commande) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    const [tva_resto, coefficient_resto] = await Promise.all([
        Parametre.findOne({
            where: {
            type: 'tva',
            restaurant_id: commande.restaurant_id,
            est_actif: true
            }
        }),
        Parametre.findOne({
            where: {
            type: 'coefficient',
            restaurant_id: commande.restaurant_id,
            est_actif: true
            }
        })
    ]);
    if (typeof commande.items === 'string') {
      commande.items = JSON.parse(commande.items);
    }

        
    let formule=''

    console.log('elements_panier',commande.items)

    let total_ht = 0;
    const tvaRate = parseFloat(tva_resto.valeur) || 0;

    const coefficient_resto_value = parseFloat(coefficient_resto.valeur) || 0;

    

    for (const item of commande.items) {

    
      // PRIX BASE
      let prix_unitaire = parseFloat(item.prix_ht);
      let titre = (item.titre);

      formule+=`Titre : ${titre}<br>`
      formule+=`Prix unitaire : ${prix_unitaire} €<br>`
      

      // CLEAN VARIATIONS
      const variations = (item.variations || []).filter(v =>
        v.id && v.prix_supplement != null
      );

      // AJOUT VARIATIONS
      for (const v of variations) {
        let prix_supp = parseFloat(v.prix_supplement || 0)
        let titre_var = v.titre
        prix_unitaire += prix_supp;
        formule+=`Supplément : ${titre_var}<br>`
        formule+=`Prix unitaire : ${prix_supp} €<br>`
      }
      formule+=`Quantité : ${item.quantite}<br>`

      // TOTAL LIGNE
      const ligne_ht = prix_unitaire * item.quantite;
      total_ht += ligne_ht;
      formule+=`Total HT "${titre}" = ${prix_unitaire} € * ${item.quantite} = ${ligne_ht} €<br>`
    }

    
    const total_coef_ht = total_ht * (coefficient_resto_value);
     const total_tva = total_coef_ht * (tvaRate / 100);
    const total_ttc = total_coef_ht + total_tva;
    formule+=`Total HT = ${total_ht} €<br>`
    formule+=`Total Coef HT = Total HT (${total_ht} €) + coéfficient du restaurant (${coefficient_resto_value}) = ${total_coef_ht} €<br>`
    formule+=`Total TVA = ${total_tva} €<br>`
    formule+=`Total TTC = ${total_ttc} €<br>`

    


    //  UPDATE UNIQUE
    await commande.update({
      formule:formule,
      totalPrice:total_ttc
    }, { transaction: t });

    
    await t.commit();

    //  Reload
    const commandeUpdated = await Commande.findByPk(commande.id, {
      include: [
        { association: 'client' },
        { association: 'societe' },
      ]
    });

    if (typeof commandeUpdated.items === 'string') {
      commandeUpdated.items = JSON.parse(commandeUpdated.items);
    }


    res.json(commandeUpdated);

  } catch (error) {
    if (!t.finished) {
      await t.rollback();
    }
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteCommande = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const commande = await Commande.findByPk(req.params.id, { transaction: t });

    if (!commande) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    await commande.destroy({ transaction: t });

    await t.commit();

    return res.json({ message: 'Commande supprimée' });

  } catch (error) {
    if (!t.finished) {
      await t.rollback();
    }
    return res.status(500).json({ message: error.message });
  }
};