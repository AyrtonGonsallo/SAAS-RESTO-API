const { Notification } = require('../models');

class NotificationService {

  async createNotification({
    reservation,
    titre,
    texte,
    utilisateur_id = 0,
    type = 'message de confirmation',
    canal = 'site',
    delayMinutes = 60
  }) {

    return await Notification.create({
      titre,
      date_rappel: new Date(Date.now() + delayMinutes * 60 * 1000),
      type,
      canal,
      texte,
      statut_lecture: 'non lue',
      societe_id: reservation.societe_id,
      restaurant_id: reservation.restaurant_id,
      utilisateur_id,
    });
  }

}

module.exports = new NotificationService();