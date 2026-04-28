const db = require('../models');
const {  Livraison,Societe,Restaurant,Utilisateur,Commande } = db;
const notificationService = require('../services/notifications.service');
exports.createLivraison = async (req, res) => {
  try {

    const {
      date_livraison,
      heure_livraison,
      ...rest
    } = req.body;

     //  2. DATE
    const dateObj = new Date(Date.UTC(
      date_livraison.year,
      date_livraison.month - 1,
      date_livraison.day,
      heure_livraison.hour,
      heure_livraison.minute,
      heure_livraison.second || 0
    ));
    const livraison = await Livraison.create({
      ...rest,
      date_livraison: dateObj,
    });

    //  9. RELOAD (hors transaction → plus rapide)
    const livraisonObjet = await Livraison.findByPk(livraison.id, {
      include: [
        { association: 'client' },
        { association: 'livreur' },
      ]
    });

    const dateLivraison = new Date(livraisonObjet.date_livraison).toLocaleString('fr-FR');

    
        await notificationService.createNotification({
            objet:livraisonObjet,
            titre: `Nouvelle livraison`,
            type:'info',
            texte: `Vous avez une nouvelle livraison ${livraisonObjet.id} : Client "${livraisonObjet.client.prenom} ${livraisonObjet.client.nom}" livreur "${livraisonObjet.livreur.prenom} ${livraisonObjet.livreur.nom}" pour le "${dateLivraison}" dans le restaurant ${livraisonObjet.restaurant_id}`,
        });
    
        await notificationService.createNotification({
             objet:livraisonObjet,
            titre: `Nouvelle livraison`,
            type:'rappel',
            texte: `N'oubliez pas votre livraison ${livraisonObjet.id} pour ${dateLivraison}`,
            utilisateur_id: livraisonObjet.client_id
        });
    res.json(livraisonObjet);
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message });
  }
};

exports.getLivraisons = async (req, res) => {
  try {
    const selectedRestaurantId = req.query.restaurant_id;
    let restaurantFilter = {};

    let ishigh = req.role_priorite<4

    if (!ishigh) {
        if (selectedRestaurantId) {
        // 🔥 filtre sur UN restaurant
        restaurantFilter = {
            restaurant_id: selectedRestaurantId,
            societe_id: req.societe_id
        };
        } else {
        // 🔥 filtre sur plusieurs restaurants autorisés
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
    

    const livraisons = await Livraison.findAll({
         where:restaurantFilter,
          include: [
            {
                model: Restaurant,
                attributes: ['id', 'nom', 'coordonnees_google_maps', 'ville', 'adresse', 'heure_debut', 'heure_fin', 'telephone'],
                required: false,
            },
            {
                model: Societe,
                attributes: ['id', 'titre', ],
                as: 'societe',
                required: false,
            },
            {
              model: Utilisateur,
              as: 'client',
              required: false
            },
            {
              model: Utilisateur,
              as: 'livreur',
              required: false
            },
            {
              model: Commande,
              as: 'commande',
              required: false
            },
        ],

    }
);

    res.json(livraisons);
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message });
  }
};

exports.getLivraisonById = async (req, res) => {
  try {
    const livraison = await Livraison.findByPk(req.params.id);

    if (!livraison) {
      return res.status(404).json({ message: 'Livraison non trouvé' });
    }

    res.json(livraison);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateLivraison = async (req, res) => {
  try {

     const {
      date_livraison,
      heure_livraison,
      ...rest
    } = req.body;

     //  2. DATE
    const dateObj = new Date(Date.UTC(
      date_livraison.year,
      date_livraison.month - 1,
      date_livraison.day,
      heure_livraison.hour,
      heure_livraison.minute,
      heure_livraison.second || 0
    ));
    const livraison = await Livraison.findByPk(req.params.id);

    if (!livraison) {
      return res.status(404).json({ message: 'Livraison non trouvé' });
    }

    await livraison.update(
      {
        date_livraison:dateObj,
        ...rest
      }
    );

    res.json(livraison);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteLivraison = async (req, res) => {
  try {
    const livraison = await Livraison.findByPk(req.params.id);

    if (!livraison) {
      return res.status(404).json({ message: 'Livraison non trouvé' });
    }

    await livraison.destroy();

    res.json({ message: 'Livraison supprimé' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};