const db = require('../models');
const {   Role,} = db;
const { Op } = require('sequelize');
exports.ajouterRole = async (req, res,next) => {
  try {
    const { titre, type, priorite, commentaire } = req.body;

    const role = await Role.create({
      titre,
      type,
      priorite,
      commentaire
    });

    return res.status(201).json({
      success: true,
      data: role
    });

  } catch (error) {
    next(error); // 👈 envoie au middleware
  }
};

exports.getRoles = async (req, res) => {
  try {

    let roleFilter = {};
    const user_priorite = req.query.priorite;
    if (!req.isSuperAdmin) {
     
        roleFilter = {
          priorite: {
            [Op.gt]: user_priorite
          },
        };
      
    }else{
      roleFilter = {} 
    }
      

    const roles = await Role.findAll({
      where: roleFilter,
      order: [['priorite', 'ASC']]
    });

    return res.status(200).json(roles);

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Erreur serveur'
    });
  }
};

exports.getRoleById = async (req, res, next) => {
  try {
    const id = req.params.id;

    const role = await Role.findByPk(id);

    if (!role) {
      return res.status(404).json({
        message: 'Rôle non trouvé'
      });
    }

    return res.status(200).json(role);

  } catch (error) {
    next(error);
  }
};

exports.updateRole = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { titre, type, priorite, commentaire } = req.body;

    const role = await Role.findByPk(id);

    if (!role) {
      return res.status(404).json({
        message: 'Rôle non trouvé'
      });
    }

    await role.update({
      titre,
      type,
      priorite,
      commentaire
    });

    return res.status(200).json(role);

  } catch (error) {
    next(error);
  }
};



exports.deleteRole = async (req, res, next) => {
  try {
    const id = req.params.id;

    const role = await Role.findByPk(id);

    if (!role) {
      return res.status(404).json({
        message: 'Rôle non trouvé'
      });
    }

    await role.destroy();

    return res.status(200).json({
      message: 'Rôle supprimé avec succès'
    });

  } catch (error) {
    next(error);
  }
};