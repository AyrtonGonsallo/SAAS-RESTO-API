const db = require('../models');
const {  Commande,Produit,Livraison,Menu,VariationProduit } = db;





exports.updateMobileCommande = async (req, res) => {

  console.log("req.body",req.body)
  const t = await db.sequelize.transaction();

  try {
   

    const commande = await Commande.findByPk(req.params.id, {
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
