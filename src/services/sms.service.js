// services/sms.service.js

const twilio = require('twilio');

class SmsService {

    constructor() {

        this.client = twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );

        this.from = process.env.TWILIO_PHONE_NUMBER;
    }

    async sendSMS(to, message) {

        try {

            const result = await this.client.messages.create({
                body: message,
                //from: this.from,
                from: this.from,
                to: to
            });

            console.log('SMS envoyé :', result.sid);

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

module.exports = new SmsService();