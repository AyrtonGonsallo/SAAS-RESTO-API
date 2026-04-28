const db = require('../models');
const {  Commande,Produit } = db;





exports.updateMobileCommande = async (req, res) => {

    console.log("req.body",req.body)
  const t = await db.sequelize.transaction();

  try {
    const commande = await Commande.findByPk(req.params.id, {
      transaction: t,
      lock: t.LOCK.UPDATE //  important
    });

    if (!commande) {
      await t.rollback();
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    const former_statut = commande.statut;

    const {
      statut
    } = req.body;

   

   
    // groupes
    const actifs = ['Nouvelle', 'En préparation', 'Prête'];
    const inactifs = ['Annulée'];



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
      }
    }

    // ANNULÉ → ACTIF = reprendre le stock
    else if (inactifs.includes(former_statut) && actifs.includes(statut)) {
      for (const item of elements_panier) {
        await Produit.decrement(
          'stock',
          {
            by: item.quantite,
            where: { id: item.productId },
            transaction: t
          }
        );
      }
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
