const db = require('../models');
const {  Menu,Produit, Restaurant } = db;
const { Op } = require('sequelize');


exports.ajouterMenu = async (req, res, next) => {
  try {
    const image = req.file ? req.file.filename : null;
    console.log("image",image)

    const {
      liste_produits,
      ...menuData
    } = req.body;

    const produits = liste_produits ? JSON.parse(liste_produits) : [];
    menuData.image = image;

    // 1. créer menu
    const menu = await Menu.create(menuData);

    // 2. associer produits (si fournis)
    if (produits.length > 0) {
      await menu.setProduits(produits);
    }

    // 3. reload avec relations
    const menuCreated = await Menu.findByPk(menu.id, {
      include: [
        { association: 'produits' },
      ]
    });

    return res.status(201).json({
      success: true,
      message: "Menu créé avec succès",
      data: menuCreated
    });

  } catch (error) {
    console.log(error.message)
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getMenus =  async (req, res) => {
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
    const menus = await Menu.findAll({
      where: restaurantFilter,
      include: [
       {
          model: Restaurant,
          attributes: ['id', 'nom', 'coordonnees_google_maps', 'ville', 'adresse', 'heure_debut', 'heure_fin', 'telephone'],
          required: false,
        
        },
        { association: 'produits' }
      
      ],
      order: [['societe_id', 'ASC'],['restaurant_id', 'ASC'],['updated_at', 'DESC']]
    });

    return res.status(200).json(menus);

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Erreur serveur'
    });
  }
};


exports.getMenuById = async (req, res, next) => {
  try {
    const id = req.params.id;

    const menu = await Menu.findByPk(id, {
      include: [
        { association: 'produits' }
      ]
    });

    if (!menu) {
      return res.status(404).json({
        message: 'Menu non trouvé'
      });
    }

    return res.status(200).json(menu);

  } catch (error) {
    next(error);
  }
};

exports.updateMenu = async (req, res, next) => {
  try {

    const { id } = req.params;

    const {
      liste_produits,
      ...menuData
    } = req.body;
    const produits = liste_produits ? JSON.parse(liste_produits) : [];
    console.log('produits',produits)

    const image = req.file ? req.file.filename : null;

    // 1. chercher menu
    const menu = await Menu.findByPk(id);

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: "Menu introuvable"
      });
    }

    // 2. update champs simples
    await menu.update(menuData);

    if(image){
      await menu.update({
        image,
      });
    }

    // 3. update relations produits si fournis
    if (Array.isArray(produits)) {
      await menu.setProduits(produits);
    }

    // 4. reload complet
    const updatedMenu = await Menu.findByPk(id, {
      include: [
        { association: 'produits' }
      ]
    });

    return res.status(200).json({
      success: true,
      message: "Menu mis à jour avec succès",
      data: updatedMenu
    });

  } catch (error) {
    next(error);
  }
};



exports.deleteMenu = async (req, res, next) => {
  try {
    const id = req.params.id;

    const menu = await Menu.findByPk(id);

    if (!menu) {
      return res.status(404).json({
        message: 'Menu non trouvé'
      });
    }

     
    await menu.destroy();

   

    return res.status(200).json({
      message: 'Menu supprimé avec succès'
    });

  } catch (error) {
    next(error);
  }
};


