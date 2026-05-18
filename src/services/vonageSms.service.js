// services/sms.service.js

const { Vonage } = require('@vonage/server-sdk');
const { Channels } = require('@vonage/messages');
class VonageSmsService {

    constructor() {
        this.vonage = new Vonage({
            apiKey: process.env.VONAGE_API_KEY,       // ← dans .env
            apiSecret: process.env.VONAGE_API_SECRET,
        });
    }

    async sendVonageSms(to, message) {

        try {

            const result = await this.vonage.sms.send({
                messageType: 'text',
                channel: Channels.SMS,
                to: to,
                from: "Vonage APIs",   // ou ton numéro Vonage
                text: message,
                type: 'unicode'  
            });

            console.log('SMS envoyé :', result.messages[0].messageId);

            return {
                success: true,
                messageId: result.messages[0].messageId
            };

        } catch (error) {

            console.error('Erreur Vonage :', error);

            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = new VonageSmsService();