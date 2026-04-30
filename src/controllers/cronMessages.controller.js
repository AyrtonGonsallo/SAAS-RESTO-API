
const db = require('../models');
const {  Message,Parametre,Utilisateur,Restaurant } = db;
const emailService = require('../services/mailer.service');

exports.sendQueuedMessages = async (req, res) => {
  try {

    const messages = await Message.findAll({
      where: { statut_envoi: 'en_attente' },
      include: [
        { model: Utilisateur, as: 'client' },
        { model: Utilisateur, as: 'employe' },
        { model: Restaurant }
      ],
      order: [['created_at', 'ASC']]
    });

    let messagesSmsEnvoyees = 0;
    let messagesEnvoyees = 0;
    let messagesEmailEnvoyees = 0;

    const now = new Date();
    for (const message of messages) {

      const type = message.type//'sms', 'email'
      const destinataire = (message.client);
      const expediteur = (message.employe);
      const restaurant = (message.Restaurant);
      const email_client = destinataire.email
      const nom_restaurant = restaurant.nom
      const telephone_restaurant = restaurant.telephone
      const telephone = destinataire.telephone
      if(type=='sms' && telephone){
        //plus tard on a pas de plateforme
        messagesSmsEnvoyees++
      }else if(type=='email' && email_client){
        messagesEmailEnvoyees++
        let texte = message.texte
        let titre = message.titre
        let nom_client = destinataire.nom
        let prenom_client = destinataire.prenom
        let nom_expediteur= expediteur.nom
        let prenom_expediteur= expediteur.prenom
        await emailService.sendMail({
          to: 'ayrtongonsallo444@gmail.com',
          subject: titre,
          template: 'contact-client.ejs',
          context: { titre,texte,nom_client,prenom_client,nom_expediteur,prenom_expediteur,email_client,nom_restaurant,telephone_restaurant } // variable à injecter dans ejs
        });

      }
      await message.update({ date_envoi:now,statut_envoi:'envoyé' });
      messagesEnvoyees++;
        

    }

     return res.status(200).json({
      success: true,
      message: "🔄 Traitement des messages en attente",
      data: {
        total_messages_traitées: messages.length,
        messagesEmailEnvoyees: messagesEmailEnvoyees,
        messagesSmsEnvoyees:messagesSmsEnvoyees,
        messagesEnvoyees: messagesEnvoyees,
        statut: "OK"
      }
    });
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message });
  }
};


