const db = require('../models');
const emailService = require('../services/mailer.service');
const {   Commande,Mail,Reservation,Parametre,Restaurant,ZoneTable } = db;
const notificationService = require('../services/notifications.service');
const { Op,Sequelize } = require('sequelize');
const ejs = require('ejs');
const he = require('he');





exports.sendMailReservation = async (req, res) => {

  try {
    


    //  9. RELOAD (hors transaction → plus rapide)
    const reservationObjet = await Reservation.findByPk(req.params.id, {
      include: [
        { association: 'client' },
        { association: 'tables',
          include: [
            { model: ZoneTable }
          ]
        },
        {
            model: Restaurant,
            attributes: ['id', 'nom', 'coordonnees_google_maps', 'ville', 'adresse', 'heure_debut', 'heure_fin', 'telephone'],
            required: false,
        },
        { association: 'service' },
        { association: 'societe' },
        { association: 'tags' },
      ]
    });


      // chercher le paramètre d'envoi mail
    const params = await Parametre.findOne({
      where: {
        restaurant_id: reservationObjet.restaurant_id,
        type: 'envoi_de_mail_recap_reservation',
        est_actif: true
      }
    });
    
    console.log("EMAIL PARAM CHECK =", params);

    // si activation email OK
    if (params) {
      try {
        const restaurant = await Restaurant.findByPk(reservationObjet.restaurant_id);

        const nom_restaurant = restaurant?.nom || '';
        const telephone_restaurant = restaurant?.telephone || '';

        const titre = 'Récapitulatif de votre réservation';

        const dateReservation = new Date(reservationObjet.date_reservation).toLocaleString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        const dateCreation = new Date(reservationObjet.created_at).toLocaleString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });


      let texte_new_res = `Vous avez une nouvelle réservation au restaurant ${nom_restaurant} le ${dateCreation}.<br><br>

            ------------------------------------------------------------<br><br>

           📅 Récapitulatif de votre réservation :<br><br>
           - Date de réservation : ${dateReservation}<br>
           - Client : ${reservationObjet.client.prenom} ${reservationObjet.client.nom}<br>
           - Nombre de personnes : ${reservationObjet.nombre_de_personnes}<br>
           - Nombre de couverts : ${reservationObjet.nb_couverts}<br>
           - nombre de tables : ${reservationObjet.tables.length} <br><br>
           - Demandes spéciales : ${reservationObjet.demandes_speciales}<br>
           - Commentaire : ${reservationObjet.notes}<br>
           - lien : <a href="/reservations/modifier-reservation/${reservationObjet.id}" target="_blank">Reservation ${reservationObjet.id}</a><br>
           `


           let texte_rappel_res = `N'oubliez pas votre réservation au restaurant ${nom_restaurant} le ${dateCreation}.<br><br>

            ------------------------------------------------------------<br><br>

           📅 Récapitulatif de votre réservation :<br><br>
           - Date de réservation : ${dateReservation}<br>
           - Client : ${reservationObjet.client.prenom} ${reservationObjet.client.nom}<br>
           - Nombre de personnes : ${reservationObjet.nombre_de_personnes}<br>
           - Nombre de couverts : ${reservationObjet.nb_couverts}<br>
           - nombre de tables : ${reservationObjet.tables.length} <br><br>
           - Demandes spéciales : ${reservationObjet.demandes_speciales}<br>
           - Commentaire : ${reservationObjet.notes}<br>
           - lien : <a href="/reservations/modifier-reservation/${reservationObjet.id}" target="_blank">Reservation ${reservationObjet.id}</a><br>`

    await notificationService.createNotification({
        objet:reservationObjet,
        titre: `Nouvelle reservation`,
        type:'info',
        texte: texte_new_res,
    });

    await notificationService.createNotification({
         objet:reservationObjet,
        titre: `Nouvelle reservation`,
        type:'rappel',
        texte: texte_rappel_res,
        utilisateur_id: reservationObjet.client_id
    });


    const template_body = await Mail.findOne({
      where: {
        restaurant_id: reservationObjet.restaurant_id,
        type: 'recap-reservation',
        section:'body-1'
      }
    });

    const template_footer_haut = await Mail.findOne({
      where: {
        restaurant_id: reservationObjet.restaurant_id,
        type: 'recap-reservation',
        section:'footer-1'
      }
    });


    const template_footer_bas = await Mail.findOne({
      where: {
        restaurant_id: reservationObjet.restaurant_id,
        type: 'recap-reservation',
        section:'footer-2'
      }
    }); 
    /*
    les templates ont de champs texte avec 

    <p class="center"> Ce message a &#233;t&#233; envoy&#233; automatiquement &#224; <a href="mailto:&lt;%= email %&gt;">&lt;%= email %&gt;</a> dans le cadre de votre inscription au restaurant &lt;%= nom_restaurant %&gt; <br> <strong>Une question ?</strong> <br> Contactez votre Conseiller Resto au <a href="tel:&lt;%= telephone_restaurant %&gt;"> &lt;%= telephone_restaurant %&gt;</a> Nos horaires sont <a href="#">consultables ici</a>. </p>

    */

    const context = {
      titre,
      nom: reservationObjet.client.nom,
      prenom: reservationObjet.client.prenom,
      email: reservationObjet.client.email,
      nom_restaurant,
      nb_tables: reservationObjet.tables.length,
      telephone_restaurant,
      date_reservation: dateReservation,
      date_creation: dateCreation,
      nombre_personnes: reservationObjet.nombre_de_personnes,
      nombre_couverts: reservationObjet.nb_couverts,
      demandes_speciales: reservationObjet.tags?.map(tag => tag.titre).join(', ') || '',
      commentaire: reservationObjet.notes
    };

    // Compilation des templates venant de la BDD
   const body = template_body
  ? ejs.render(he.decode(template_body.texte), context)
  : '';

    console.log('TEMPLATE BDD :');
      console.log(template_footer_haut?.texte);

const footer_haut = template_footer_haut
  ? ejs.render(he.decode(template_footer_haut.texte), context)
  : '';


      console.log('footer_haut APRES EJS :');
      console.log(footer_haut);

   const footer_bas = template_footer_bas
  ? ejs.render(he.decode(template_footer_bas.texte), context)
  : '';


    await emailService.sendMail({
      to: reservationObjet.client.email,
      subject: titre,
      template: 'recap-reservation.ejs',
      context: {
        footer_bas:footer_bas,
        footer_haut:footer_haut,
        body:body,
       titre,
      }
    });

  } catch (err) {
    console.error("Erreur email (non bloquante):", err);
  }
}

   
    res.json(reservationObjet);

  } catch (error) {
   
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};











exports.sendMailCommande = async (req, res) => {

  try {
    


    //  9. RELOAD (hors transaction → plus rapide)
    const commandeObjet = await Commande.findByPk(req.params.id, {
      include: [
        {
          model: Restaurant,
          attributes: ['id', 'nom', 'coordonnees_google_maps', 'ville', 'adresse', 'heure_debut', 'heure_fin', 'telephone'],
          required: false,
        },
        { association: 'client' },
        { association: 'societe' },
      ]
    });

    if (typeof commandeObjet.items === 'string') {
      commandeObjet.items = JSON.parse(commandeObjet.items);
    }

    let restaurant_id = commandeObjet.restaurant_id

  const params = await Parametre.findOne({
  where: {
    restaurant_id,
    type: 'envoi_de_mail_recap_click_and_collect',
    est_actif: true
  }
});

if (params) {
  try {

    const restaurant = commandeObjet.Restaurant;
    const client = commandeObjet?.client;

    const titre = 'Récapitulatif de votre commande';

    const dateCommande = new Date(commandeObjet.date_retrait).toLocaleString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const dateCreation = new Date(commandeObjet.created_at).toLocaleString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

 
    const items = typeof commandeObjet.items === 'string'
      ? JSON.parse(commandeObjet.items)
      : commandeObjet.items || [];

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

    let texte_new_commande = `
    Vous avez une nouvelle commande chez ${restaurant?.nom}.<br><br>

    📅 Date de retrait : ${dateCommande}<br>
    💰 Total TTC : ${commandeObjet.totalPrice} €<br>
    Lien : <a href="/commandes/modifier-commande/${commandeObjet.id}" target="_blank">Commande ${commandeObjet.id}</a>
    <br><br>

    --------------------------------------------------<br><br>

    Détail de votre commande :<br><br>

    <table style="width:100%; border-collapse:collapse; font-family:Arial;">
      <thead>
        <tr style="background:#f2f2f2;">
          <th align="left" style="padding:10px;">Produit</th>
          <th align="left" style="padding:10px;">Variations</th>
          <th align="left" style="padding:10px;">Quantité</th>
          <th align="left" style="padding:10px;">Prix unitaire TTC</th>
          <th align="left" style="padding:10px;">Prix TTC</th>
        </tr>
      </thead>

      <tbody>

        ${produits.map(p => `
          <tr>
            <td style="padding:10px; border-bottom:1px solid #ddd;">
              ${p.titre ?? ''}
            </td>

            <td style="padding:10px; border-bottom:1px solid #ddd;">
              ${p.variations ?? ''}
            </td>

            <td style="padding:10px; border-bottom:1px solid #ddd;">
              ${p.quantite ?? 0}
            </td>

            <td style="padding:10px; border-bottom:1px solid #ddd;">
              ${p.prix_ht ?? 0} €
            </td>

            <td style="padding:10px; border-bottom:1px solid #ddd;">
              ${(Number(p.prix_ht || 0) * Number(p.quantite || 0)).toFixed(2)} €
            </td>
          </tr>
        `).join('')}

        <tr style="background:#f2f2f23d; border-bottom:1px solid #ddd;">
          <td colspan="3" style="padding:12px;"></td>

          <td colspan="2" style="padding:10px; font-weight:bold;">
            Total ${commandeObjet.totalPrice} € TTC<br>
            Dont TVA (${commandeObjet.tva} %) = ${commandeObjet.total_tva} €
          </td>
        </tr>

      </tbody>
    </table>
    `;

    let texte_rappel_commande = `
      N'oubliez pas votre commande chez ${restaurant?.nom}.<br><br>

      📅 Date de retrait : ${dateCommande}<br>
      💰 Total TTC : ${commandeObjet.totalPrice} €<br>
      Lien : <a href="/commandes/modifier-commande/${commandeObjet.id}" target="_blank">Commande ${commandeObjet.id}</a>
      <br><br>

      --------------------------------------------------<br><br>

      Détail de votre commande :<br><br>

      <table style="width:100%; border-collapse:collapse; font-family:Arial;">

        <thead>
          <tr style="background:#f2f2f2;">
            <th align="left" style="padding:10px;">Produit</th>
            <th align="left" style="padding:10px;">Variations</th>
            <th align="left" style="padding:10px;">Quantité</th>
            <th align="left" style="padding:10px;">Prix unitaire TTC</th>
            <th align="left" style="padding:10px;">Prix TTC</th>
          </tr>
        </thead>

        <tbody>

          ${produits.map(p => `
            <tr>
              <td style="padding:10px; border-bottom:1px solid #ddd;">
                ${p.titre ?? ''}
              </td>

              <td style="padding:10px; border-bottom:1px solid #ddd;">
                ${p.variations ?? ''}
              </td>

              <td style="padding:10px; border-bottom:1px solid #ddd;">
                ${p.quantite ?? 0}
              </td>

              <td style="padding:10px; border-bottom:1px solid #ddd;">
                ${p.prix_ht ?? 0} €
              </td>

              <td style="padding:10px; border-bottom:1px solid #ddd;">
                ${(Number(p.prix_ht || 0) * Number(p.quantite || 0)).toFixed(2)} €
              </td>
            </tr>
          `).join('')}

          <tr style="background:#f2f2f23d; border-bottom:1px solid #ddd;">
            <td colspan="3" style="padding:12px;"></td>

            <td colspan="2" style="padding:10px; font-weight:bold;">
              Total ${commandeObjet.totalPrice} € TTC<br>
              Dont TVA (${commandeObjet.tva} %) = ${commandeObjet.total_tva} €
            </td>
          </tr>

        </tbody>
      </table>
      `;



    await notificationService.createNotification({
         objet:commandeObjet,
        titre: `Nouvelle commande`,
        type:'info',
        texte: texte_new_commande,
    });

    await notificationService.createNotification({
         objet:commandeObjet,
        titre: `Nouvelle commande`,
        type:'rappel',
        texte: texte_rappel_commande,
        utilisateur_id: commandeObjet.client_id
    });





 const template_body_haut = await Mail.findOne({
      where: {
        restaurant_id: commandeObjet.restaurant_id,
        type: 'recap-commande',
        section:'body-1'
      }
    });

    const template_body_bas = await Mail.findOne({
      where: {
        restaurant_id: commandeObjet.restaurant_id,
        type: 'recap-commande',
        section:'body-2'
      }
    });

    const template_footer_haut = await Mail.findOne({
      where: {
        restaurant_id: commandeObjet.restaurant_id,
        type: 'recap-commande',
        section:'footer-1'
      }
    });


    const template_footer_bas = await Mail.findOne({
      where: {
        restaurant_id: commandeObjet.restaurant_id,
        type: 'recap-commande',
        section:'footer-2'
      }
    }); 
    /*
    les templates ont de champs texte avec 

    <p class="center"> Ce message a &#233;t&#233; envoy&#233; automatiquement &#224; <a href="mailto:&lt;%= email %&gt;">&lt;%= email %&gt;</a> dans le cadre de votre inscription au restaurant &lt;%= nom_restaurant %&gt; <br> <strong>Une question ?</strong> <br> Contactez votre Conseiller Resto au <a href="tel:&lt;%= telephone_restaurant %&gt;"> &lt;%= telephone_restaurant %&gt;</a> Nos horaires sont <a href="#">consultables ici</a>. </p>

    */

    const context = {
      titre,
        nom: commandeObjet.client?.nom,
        prenom: commandeObjet.client?.prenom,
        email: commandeObjet.client?.email,
        nom_restaurant: restaurant?.nom,
        telephone_restaurant: restaurant?.telephone,
        date_commande: dateCommande,
        date_creation: dateCreation,
        tvaRate:commandeObjet.tva,
        total_tva:commandeObjet.total_tva,
        total_coef_ht:commandeObjet.total_coef,
        prix_total: commandeObjet.totalPrice,
        produits
    };

    // Compilation des templates venant de la BDD
    const body_haut = template_body_haut
  ? ejs.render(he.decode(template_body_haut.texte), context)
  : '';

    // Compilation des templates venant de la BDD
    const body_bas = template_body_bas
  ? ejs.render(he.decode(template_body_bas.texte), context)
  : '';



   const footer_haut = template_footer_haut
  ? ejs.render(he.decode(template_footer_haut.texte), context)
  : '';



   const footer_bas = template_footer_bas
  ? ejs.render(he.decode(template_footer_bas.texte), context)
  : '';


    await emailService.sendMail({
      to: commandeObjet.client.email,
      subject: titre,
      template: 'recap-commande.ejs',
      context: {
        footer_bas:footer_bas,
        footer_haut:footer_haut,
        body_haut:body_haut,
        body_bas:body_bas,
        titre,
        tvaRate:commandeObjet.tva,
        total_tva:commandeObjet.total_tva,
        total_coef_ht:commandeObjet.total_coef,
        prix_total: commandeObjet.totalPrice,
        produits
       
      }
    });










  } catch (err) {
    console.error("Erreur email commande (non bloquante):", err);
  }
}

    res.json(commandeObjet);

  } catch (error) {
   
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};