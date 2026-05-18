// services/sms.service.js

const twilio = require('twilio');

class WhatsappService {

    constructor() {

        this.client = twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );

        this.from = process.env.TWILIO_WHATSAPP_NUMBER;
    }

    async sendWhatsapp(to, message) {

        try {

            const result = await this.client.messages.create({
                body: message,
                //from: `whatsapp:${}`,
                from: `whatsapp:${this.from}`,
                to: `whatsapp:${to}`
            });

            console.log(`whatsapp:${to} envoyé`, result.sid);

            return {
                success: true,
                sid: result.sid
            };

        } catch (error) {

            console.error('Erreur Twilio :', error);

            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = new WhatsappService();