const db = require('../models');
const {  Commande,Produit,Livraison,Menu,VariationProduit,Restaurant } = db;
const emailService = require('../services/mailer.service');




exports.updateMobileCommande = async (req, res) => {

  console.log("req.body",req.body)
  const t = await db.sequelize.transaction();

  try {
   

    const commande = await Commande.findByPk(req.params.id, {
      include: [
        { association: 'client' },
        { association: 'societe' },
        {
            model: Restaurant,
            attributes: ['id', 'nom', 'coordonnees_google_maps', 'ville', 'adresse',  'telephone',],
            required: false,
        },
      ],
      transaction: t,
      lock: t.LOCK.UPDATE //  important
    });

    const livraison = await Livraison.findOne({
      where: { commande_id: commande.id },
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!commande) {
      await t.rollback();
      return res.status(404).json({ message: 'Commande non trouvée' });
    }
    if (!livraison) {
      await t.rollback();
      return res.status(404).json({ message: 'livraison non trouvée' });
    }

    // groupes
    const actifs = ['Nouvelle', 'En préparation', 'Prête'];
    const inactifs = ['Annulée'];

    const former_statut = commande.statut;

    const {
      statut
    } = req.body;

   const elements_panier = typeof commande.items === 'string'
      ? JSON.parse(commande.items)
      : commande.items;

    // ACTIF → ANNULÉ = remettre le stock
    if (actifs.includes(former_statut) && inactifs.includes(statut)) {
      for (const item of elements_panier) {
        await Produit.increment(
          'stock',
          {
            by: item.quantite,
            where: { id: item.productId },
            transaction: t
          }
        );
        const variations = (item.variations || []).filter(v =>
          v.id && v.prix_supplement != null
        );

        // AJOUT VARIATIONS
        for (const v of variations) {
          await VariationProduit.increment(
            'stock',
            {
              by: item.quantite,
              where: { id: v.id },
              transaction: t
            }
          );
        }
      }
      await livraison.update({ statut:'Annulée',});
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
          const variations = (item.variations || []).filter(v =>
            v.id && v.prix_supplement != null
          );

          // AJOUT VARIATIONS
          for (const v of variations) {
            await VariationProduit.decrement(
              'stock',
              {
                by: item.quantite,
                where: { id: v.id },
                transaction: t
              }
            );
          }
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
      await livraison.update({ statut:'En attente'},{ transaction: t });
    }

    if(statut=="Prête"){

      const client = commande?.client;

      const titre = 'Votre commande est prête';

      const dateCommande = new Date(commande.date_retrait).toLocaleString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const dateCreation = new Date(commande.created_at).toLocaleString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const items = typeof commande.items === 'string'
        ? JSON.parse(commande.items)
        : commande.items || [];

      const produits = items.map(item => ({
        titre: item.titre,
        quantite: item.quantite,
        prix_ht:
          Number(item.prix_ht) +
          (item.variations?.reduce(
            (sum, v) =>
              sum + Number(v.prix_supplement || 0),
            0
          ) || 0),
        prix_ttc:
          Number(item.prix_ht) +
          (item.variations?.reduce(
            (sum, v) =>
              sum + Number(v.prix_supplement || 0),
            0
          ) || 0),
        variations: item.variations?.length
          ? item.variations.map((v) => v.titre).join(', ')
          : 'Aucune'
      }));

      
      await emailService.sendMail({
        to: client?.email,
        subject: titre,
        template: 'recap-commande-prete.ejs',
        context: {
          titre,
          nom: client?.nom,
          prenom: client?.prenom,
          email: client?.email,
          nom_restaurant: commande.Restaurant?.nom,
          telephone_restaurant: commande.Restaurant?.telephone,
          date_commande: dateCommande,
          date_creation: dateCreation,
          prix_total: commande.totalPrice,
          produits
        }
      });
    }


    //  UPDATE UNIQUE
    await commande.update({
      statut,
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
    await t.rollback();
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};
